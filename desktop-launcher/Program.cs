using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Collections.Generic;
using Microsoft.Win32;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Web.Script.Serialization;
using System.Threading;
using System.Windows.Forms;

namespace GachaDailyLauncher
{
    internal static class Program
    {
        private const int Port = 47831;
        private const string BasePath = "/gacha-daily-checkin/";
        private const string HealthPath = "/health";
        private const string AppUrl = "http://127.0.0.1:47831/gacha-daily-checkin/";
        private static TcpListener listener;
        private static NotifyIcon trayIcon;
        private static volatile bool running;

        [STAThread]
        private static void Main()
        {
            bool createdNew;
            using (Mutex mutex = new Mutex(true, "Local\\GachaDailyCheckinDesktopLauncher", out createdNew))
            {
                if (!createdNew)
                {
                    ActivateExistingWindow();
                    return;
                }

                try
                {
                    EnsureWebView2Assemblies();
                    listener = new TcpListener(IPAddress.Loopback, Port);
                    listener.Start();
                    running = true;
                    Thread serverThread = new Thread(AcceptClients);
                    serverThread.IsBackground = true;
                    serverThread.Start();

                    Application.EnableVisualStyles();
                    Application.SetCompatibleTextRenderingDefault(false);
                    Application.Run(new MainForm());
                }
                catch (Exception exception)
                {
                    MessageBox.Show(
                        "启动失败：" + exception.Message + Environment.NewLine + Environment.NewLine + AppUrl,
                        "二游日常打卡",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                }
                finally
                {
                    running = false;
                    if (listener != null)
                    {
                        listener.Stop();
                    }
                    if (trayIcon != null)
                    {
                        trayIcon.Visible = false;
                        trayIcon.Dispose();
                    }
                    mutex.ReleaseMutex();
                }
            }
        }

        [MethodImpl(MethodImplOptions.NoInlining)]
        private static void EnsureWebView2Assemblies()
        {
            string cacheDirectory = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "GachaDailyCheckin",
                "WebView2Runtime"
            );
            Directory.CreateDirectory(cacheDirectory);

            ExtractResource("launcher.WebView2.Core.dll", Path.Combine(cacheDirectory, "Microsoft.Web.WebView2.Core.dll"));
            ExtractResource("launcher.WebView2.WinForms.dll", Path.Combine(cacheDirectory, "Microsoft.Web.WebView2.WinForms.dll"));
            ExtractResource("launcher.WebView2Loader.dll", Path.Combine(cacheDirectory, "WebView2Loader.dll"));

            Environment.SetEnvironmentVariable(
                "PATH",
                cacheDirectory + ";" + Environment.GetEnvironmentVariable("PATH")
            );
            SetDllDirectory(cacheDirectory);

            AppDomain.CurrentDomain.AssemblyResolve += delegate(object sender, ResolveEventArgs args)
            {
                string assemblyName = new AssemblyName(args.Name).Name;
                if (assemblyName == "Microsoft.Web.WebView2.Core")
                {
                    return Assembly.LoadFrom(Path.Combine(cacheDirectory, "Microsoft.Web.WebView2.Core.dll"));
                }
                if (assemblyName == "Microsoft.Web.WebView2.WinForms")
                {
                    return Assembly.LoadFrom(Path.Combine(cacheDirectory, "Microsoft.Web.WebView2.WinForms.dll"));
                }
                return null;
            };
        }

        private static void ExtractResource(string resourceName, string targetPath)
        {
            Assembly assembly = Assembly.GetExecutingAssembly();
            using (Stream resource = assembly.GetManifestResourceStream(resourceName))
            {
                if (resource == null)
                {
                    throw new InvalidOperationException("缺少 WebView2 组件：" + resourceName);
                }

                using (FileStream target = new FileStream(targetPath, FileMode.Create, FileAccess.Write, FileShare.Read))
                {
                    resource.CopyTo(target);
                }
            }
        }

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        private static extern bool SetDllDirectory(string pathName);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern IntPtr FindWindow(string className, string windowName);

        [DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr windowHandle, int command);

        [DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr windowHandle);

        private static void ActivateExistingWindow()
        {
            IntPtr window = FindWindow(null, "二游日常打卡");
            if (window != IntPtr.Zero)
            {
                ShowWindow(window, 9);
                SetForegroundWindow(window);
            }
        }

        private sealed class MainForm : Form
        {
            private readonly Microsoft.Web.WebView2.WinForms.WebView2 webView;

            public MainForm()
            {
                Text = "二游日常打卡";
                StartPosition = FormStartPosition.CenterScreen;
                MinimumSize = new Size(920, 640);
                ClientSize = new Size(1180, 780);
                BackColor = Color.FromArgb(7, 17, 31);
                try
                {
                    Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
                }
                catch
                {
                }

                webView = new Microsoft.Web.WebView2.WinForms.WebView2();
                webView.Dock = DockStyle.Fill;
                webView.CreationProperties = new Microsoft.Web.WebView2.WinForms.CoreWebView2CreationProperties
                {
                    UserDataFolder = Path.Combine(
                        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                        "GachaDailyCheckin",
                        "WebView2Data"
                    )
                };
                webView.CoreWebView2InitializationCompleted += WebViewInitializationCompleted;
                Controls.Add(webView);
                Shown += delegate
                {
                    webView.Source = new Uri(AppUrl);
                };
            }

            private void WebViewInitializationCompleted(
                object sender,
                Microsoft.Web.WebView2.Core.CoreWebView2InitializationCompletedEventArgs eventArgs
            )
            {
                if (!eventArgs.IsSuccess)
                {
                    MessageBox.Show(
                        "应用界面初始化失败：" + eventArgs.InitializationException.Message,
                        "二游日常打卡",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
                webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
            }
        }

        private static void SetupTrayIcon()
        {
            Icon icon = null;
            try
            {
                icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
            }
            catch
            {
                icon = SystemIcons.Application;
            }

            ContextMenuStrip menu = new ContextMenuStrip();
            menu.Items.Add("打开打卡页面", null, delegate { OpenBrowser(); });
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("退出", null, delegate { ExitApplication(); });

            trayIcon = new NotifyIcon();
            trayIcon.Icon = icon;
            trayIcon.Text = "二游日常打卡";
            trayIcon.ContextMenuStrip = menu;
            trayIcon.DoubleClick += delegate { OpenBrowser(); };
            trayIcon.Visible = true;
        }

        private static void ExitApplication()
        {
            running = false;
            if (listener != null)
            {
                listener.Stop();
            }
            if (trayIcon != null)
            {
                trayIcon.Visible = false;
            }
            Application.ExitThread();
        }

        private static void OpenBrowser()
        {
            if (Environment.GetEnvironmentVariable("GACHA_LAUNCHER_NO_BROWSER") == "1")
            {
                return;
            }

            try
            {
                Process.Start(new ProcessStartInfo(AppUrl) { UseShellExecute = true });
            }
            catch (Exception exception)
            {
                MessageBox.Show(
                    "无法打开浏览器：" + exception.Message + Environment.NewLine + AppUrl,
                    "二游日常打卡",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning
                );
            }
        }

        private static void AcceptClients()
        {
            while (running)
            {
                try
                {
                    TcpClient client = listener.AcceptTcpClient();
                    ThreadPool.QueueUserWorkItem(delegate { HandleClient(client); });
                }
                catch (SocketException)
                {
                    if (running)
                    {
                        Thread.Sleep(100);
                    }
                }
                catch
                {
                    if (running)
                    {
                        Thread.Sleep(100);
                    }
                }
            }
        }

        private static void HandleClient(TcpClient client)
        {
            using (client)
            using (NetworkStream stream = client.GetStream())
            {
                stream.ReadTimeout = 5000;
                stream.WriteTimeout = 5000;

                try
                {
                    StreamReader reader = new StreamReader(stream, Encoding.ASCII, false, 1024, true);
                    string requestLine = reader.ReadLine();
                    if (String.IsNullOrWhiteSpace(requestLine))
                    {
                        return;
                    }

                    string[] requestParts = requestLine.Split(' ');
                    if (requestParts.Length < 2)
                    {
                        WriteText(stream, 400, "Bad Request", "text/plain; charset=utf-8", "Bad Request");
                        return;
                    }

                    string method = requestParts[0].ToUpperInvariant();
                    bool headOnly = method == "HEAD";
                    if (method != "GET" && !headOnly)
                    {
                        WriteText(stream, 405, "Method Not Allowed", "text/plain; charset=utf-8", "Method Not Allowed");
                        return;
                    }

                    string line;
                    while (!String.IsNullOrEmpty(line = reader.ReadLine())) { }

                    string path;
                    try
                    {
                        path = Uri.UnescapeDataString(requestParts[1].Split('?')[0]);
                    }
                    catch
                    {
                        WriteText(stream, 400, "Bad Request", "text/plain; charset=utf-8", "Bad Request");
                        return;
                    }

                    if (path == HealthPath)
                    {
                        WriteText(stream, 200, "OK", "text/plain; charset=utf-8", "gacha-daily-checkin", headOnly);
                        return;
                    }

                    if (path.Equals(BasePath + "api/detected-games", StringComparison.OrdinalIgnoreCase))
                    {
                        WriteText(stream, 200, "OK", "application/json; charset=utf-8", GetDetectedGamesJson(), headOnly);
                        return;
                    }

                    if (path.Equals(BasePath + "api/wallpapers", StringComparison.OrdinalIgnoreCase))
                    {
                        WriteText(stream, 200, "OK", "application/json; charset=utf-8", GetWallpapersJson(), headOnly);
                        return;
                    }

                    if (path.StartsWith(BasePath + "api/wallpaper-file", StringComparison.OrdinalIgnoreCase))
                    {
                        HandleWallpaperFileRequest(stream, requestParts[1], headOnly);
                        return;
                    }

                    if (path == "/" || path == "/gacha-daily-checkin")
                    {
                        WriteRedirect(stream, BasePath);
                        return;
                    }

                    if (!path.StartsWith(BasePath, StringComparison.OrdinalIgnoreCase))
                    {
                        WriteRedirect(stream, BasePath);
                        return;
                    }

                    string relativePath = path.Substring(BasePath.Length).TrimStart('/');
                    if (String.IsNullOrEmpty(relativePath))
                    {
                        relativePath = "index.html";
                    }

                    byte[] body = ReadResource(relativePath);
                    if (body == null && Path.GetExtension(relativePath).Length == 0)
                    {
                        relativePath = "index.html";
                        body = ReadResource(relativePath);
                    }

                    if (body == null)
                    {
                        WriteText(stream, 404, "Not Found", "text/plain; charset=utf-8", "Not Found", headOnly);
                        return;
                    }

                    string extraHeaders = relativePath == "sw.js"
                        ? "Service-Worker-Allowed: " + BasePath + "\r\n"
                        : String.Empty;
                    WriteResponse(stream, 200, "OK", GetContentType(relativePath), body, headOnly, extraHeaders);
                }
                catch (Exception)
                {
                    try
                    {
                        WriteText(stream, 500, "Internal Server Error", "text/plain; charset=utf-8", "Internal Server Error");
                    }
                    catch
                    {
                    }
                }
            }
        }

        private static List<WallpaperRecord> cachedWallpapers;

        private static string GetWallpapersJson()
        {
            List<WallpaperRecord> wallpapers = GetWallpapers();
            System.Text.StringBuilder json = new System.Text.StringBuilder();
            json.Append("{\"wallpapers\":[");
            for (int index = 0; index < wallpapers.Count; index++)
            {
                WallpaperRecord wallpaper = wallpapers[index];
                if (index > 0)
                {
                    json.Append(',');
                }
                json.Append("{\"id\":\"");
                json.Append(JsonEscape(wallpaper.Id));
                json.Append("\",\"title\":\"");
                json.Append(JsonEscape(wallpaper.Title));
                json.Append("\",\"type\":\"");
                json.Append(JsonEscape(wallpaper.Type));
                json.Append("\",\"mediaType\":\"");
                json.Append(wallpaper.MediaType);
                json.Append("\",\"mediaUrl\":\"");
                json.Append(JsonEscape(BasePath + "api/wallpaper-file?id=" + Uri.EscapeDataString(wallpaper.Id) + "&kind=media"));
                json.Append("\",\"previewUrl\":\"");
                json.Append(JsonEscape(BasePath + "api/wallpaper-file?id=" + Uri.EscapeDataString(wallpaper.Id) + "&kind=preview"));
                json.Append("\"}");
            }
            json.Append("]}");
            return json.ToString();
        }

        private static List<WallpaperRecord> GetWallpapers()
        {
            if (cachedWallpapers != null)
            {
                return cachedWallpapers;
            }

            List<WallpaperRecord> wallpapers = new List<WallpaperRecord>();
            foreach (string libraryRoot in GetSteamLibraryRoots())
            {
                string workshopRoot = Path.Combine(libraryRoot, "steamapps", "workshop", "content", "431960");
                if (!Directory.Exists(workshopRoot))
                {
                    continue;
                }

                foreach (string wallpaperDirectory in Directory.GetDirectories(workshopRoot))
                {
                    string projectPath = Path.Combine(wallpaperDirectory, "project.json");
                    if (!File.Exists(projectPath))
                    {
                        continue;
                    }

                    try
                    {
                        string projectJson = File.ReadAllText(projectPath);
                        JavaScriptSerializer serializer = new JavaScriptSerializer();
                        Dictionary<string, object> project = serializer.Deserialize<Dictionary<string, object>>(projectJson);
                        string title = GetDictionaryString(project, "title");
                        string type = GetDictionaryString(project, "type");
                        string projectFile = GetDictionaryString(project, "file");
                        string previewFile = GetDictionaryString(project, "preview");
                        string mediaPath = null;
                        string mediaType = null;

                        string projectMediaPath = Path.Combine(wallpaperDirectory, projectFile);
                        if (type == "video" && File.Exists(projectMediaPath) && IsVideoFile(projectFile))
                        {
                            mediaPath = projectMediaPath;
                            mediaType = "video";
                        }
                        else if (type == "web" && File.Exists(Path.Combine(wallpaperDirectory, "video.webm")))
                        {
                            mediaPath = Path.Combine(wallpaperDirectory, "video.webm");
                            mediaType = "video";
                        }

                        string previewPath = Path.Combine(wallpaperDirectory, previewFile);
                        if (!File.Exists(previewPath))
                        {
                            previewPath = FindFirstPreviewFile(wallpaperDirectory);
                        }

                        if (mediaPath == null && previewPath != null && IsImageFile(previewPath))
                        {
                            mediaPath = previewPath;
                            mediaType = "image";
                        }

                        if (String.IsNullOrEmpty(title))
                        {
                            title = Path.GetFileName(wallpaperDirectory);
                        }

                        if (mediaPath != null && File.Exists(mediaPath) && previewPath != null && File.Exists(previewPath))
                        {
                            string wallpaperId = Path.GetFileName(wallpaperDirectory);
                            bool alreadyAdded = wallpapers.Find(delegate(WallpaperRecord item)
                            {
                                return item.Id == wallpaperId;
                            }) != null;
                            if (!alreadyAdded)
                            {
                                wallpapers.Add(new WallpaperRecord
                                {
                                    Id = wallpaperId,
                                    Title = title,
                                    Type = type,
                                    MediaPath = mediaPath,
                                    MediaType = mediaType,
                                    PreviewPath = previewPath
                                });
                            }
                        }
                    }
                    catch
                    {
                    }
                }
            }

            wallpapers.Sort(delegate(WallpaperRecord left, WallpaperRecord right)
            {
                return String.Compare(left.Title, right.Title, StringComparison.CurrentCultureIgnoreCase);
            });
            cachedWallpapers = wallpapers;
            return cachedWallpapers;
        }

        private static List<string> GetSteamLibraryRoots()
        {
            HashSet<string> roots = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            using (RegistryKey steamKey = Registry.CurrentUser.OpenSubKey("SOFTWARE\\Valve\\Steam"))
            {
                string steamPath = steamKey == null ? null : steamKey.GetValue("SteamPath") as string;
                if (!String.IsNullOrEmpty(steamPath))
                {
                    roots.Add(Path.GetFullPath(steamPath));
                }
            }

            roots.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Steam"));
            roots.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Steam"));
            foreach (string drive in new string[] { "C:\\", "D:\\", "E:\\", "F:\\" })
            {
                roots.Add(Path.Combine(drive, "SteamLibrary"));
            }

            List<string> result = new List<string>();
            foreach (string root in roots)
            {
                if (Directory.Exists(root))
                {
                    result.Add(root);
                    string libraryFile = Path.Combine(root, "steamapps", "libraryfolders.vdf");
                    if (File.Exists(libraryFile))
                    {
                        string vdf = File.ReadAllText(libraryFile);
                        foreach (Match match in Regex.Matches(vdf, "\"path\"\\s*\"((?:\\\\.|[^\"])*)\"", RegexOptions.IgnoreCase))
                        {
                            string libraryPath = match.Groups[1].Value.Replace("\\\\", "\\");
                            if (Directory.Exists(libraryPath) && !result.Contains(libraryPath))
                            {
                                result.Add(libraryPath);
                            }
                        }
                    }
                }
            }
            return result;
        }

        private static string GetDictionaryString(Dictionary<string, object> values, string key)
        {
            object value;
            return values.TryGetValue(key, out value) && value != null ? Convert.ToString(value) : String.Empty;
        }

        private static string ReadJsonString(string json, string propertyName)
        {
            Match match = Regex.Match(
                json,
                "\"" + Regex.Escape(propertyName) + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"",
                RegexOptions.IgnoreCase
            );
            return match.Success ? UnescapeJson(match.Groups[1].Value) : String.Empty;
        }

        private static string UnescapeJson(string value)
        {
            return value.Replace("\\\\", "\\").Replace("\\\"", "\"").Replace("\\/", "/");
        }

        private static string JsonEscape(string value)
        {
            if (value == null)
            {
                return String.Empty;
            }
            return value.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\r", "\\r").Replace("\n", "\\n");
        }

        private static bool IsVideoFile(string path)
        {
            string extension = Path.GetExtension(path).ToLowerInvariant();
            return extension == ".mp4" || extension == ".webm";
        }

        private static bool IsImageFile(string path)
        {
            string extension = Path.GetExtension(path).ToLowerInvariant();
            return extension == ".jpg" || extension == ".jpeg" || extension == ".png" || extension == ".webp" || extension == ".gif";
        }

        private static string FindFirstPreviewFile(string directory)
        {
            foreach (string extension in new string[] { "*.gif", "*.jpg", "*.jpeg", "*.png", "*.webp" })
            {
                string[] files = Directory.GetFiles(directory, extension);
                if (files.Length > 0)
                {
                    return files[0];
                }
            }
            return null;
        }
        private static void HandleWallpaperFileRequest(NetworkStream stream, string rawTarget, bool headOnly)
        {
            Uri uri = new Uri("http://localhost" + rawTarget);
            string id = GetQueryValue(uri.Query, "id");
            string kind = GetQueryValue(uri.Query, "kind");
            WallpaperRecord wallpaper = GetWallpapers().Find(delegate(WallpaperRecord item)
            {
                return item.Id == id;
            });

            if (wallpaper == null)
            {
                WriteText(stream, 404, "Not Found", "text/plain; charset=utf-8", "Wallpaper not found", headOnly);
                return;
            }

            string filePath = kind == "preview" ? wallpaper.PreviewPath : wallpaper.MediaPath;
            if (String.IsNullOrEmpty(filePath) || !File.Exists(filePath))
            {
                WriteText(stream, 404, "Not Found", "text/plain; charset=utf-8", "Wallpaper file not found", headOnly);
                return;
            }

            WriteFileResponse(stream, filePath, GetContentType(filePath), headOnly);
        }

        private static string GetQueryValue(string query, string key)
        {
            if (String.IsNullOrEmpty(query))
            {
                return String.Empty;
            }

            foreach (string pair in query.TrimStart('?').Split('&'))
            {
                string[] parts = pair.Split(new char[] { '=' }, 2);
                if (parts.Length == 2 && Uri.UnescapeDataString(parts[0]) == key)
                {
                    return Uri.UnescapeDataString(parts[1]);
                }
            }
            return String.Empty;
        }

        private static void WriteFileResponse(NetworkStream stream, string filePath, string contentType, bool headOnly)
        {
            FileInfo file = new FileInfo(filePath);
            string header =
                "HTTP/1.1 200 OK\r\n" +
                "Content-Type: " + contentType + "\r\n" +
                "Content-Length: " + file.Length + "\r\n" +
                "Cache-Control: no-cache, no-store, must-revalidate\r\n" +
                "Accept-Ranges: none\r\n" +
                "Connection: close\r\n\r\n";
            byte[] headerBytes = Encoding.ASCII.GetBytes(header);
            stream.Write(headerBytes, 0, headerBytes.Length);

            if (!headOnly)
            {
                using (FileStream fileStream = File.OpenRead(filePath))
                {
                    byte[] buffer = new byte[128 * 1024];
                    int read;
                    while ((read = fileStream.Read(buffer, 0, buffer.Length)) > 0)
                    {
                        stream.Write(buffer, 0, read);
                    }
                }
            }
        }
        private static string GetDetectedGamesJson()
        {
            List<string> detected = new List<string>();
            DetectionRule[] rules = CreateDetectionRules();
            string[] roots = new string[]
            {
                Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
                Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "D:\\Program Files",
                "D:\\Games",
                "C:\\Games",
                "D:\\miHoYo Launcher",
                "D:\\Wuthering Waves"
            };

            List<string> registryTexts = new List<string>();
            string[] registryPaths = new string[]
            {
                "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
                "SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall"
            };
            RegistryKey[] bases = new RegistryKey[] { Registry.LocalMachine, Registry.CurrentUser };

            foreach (RegistryKey baseKey in bases)
            {
                foreach (string registryPath in registryPaths)
                {
                    using (RegistryKey uninstallRoot = baseKey.OpenSubKey(registryPath))
                    {
                        if (uninstallRoot == null)
                        {
                            continue;
                        }

                        foreach (string subKeyName in uninstallRoot.GetSubKeyNames())
                        {
                            using (RegistryKey applicationKey = uninstallRoot.OpenSubKey(subKeyName))
                            {
                                if (applicationKey == null)
                                {
                                    continue;
                                }

                                string displayName = applicationKey.GetValue("DisplayName") as string;
                                if (String.IsNullOrEmpty(displayName))
                                {
                                    continue;
                                }

                                string combined = String.Join(" ", new string[]
                                {
                                    displayName,
                                    applicationKey.GetValue("InstallLocation") as string,
                                    applicationKey.GetValue("DisplayIcon") as string,
                                    applicationKey.GetValue("UninstallString") as string
                                });
                                registryTexts.Add(displayName);
                            }
                        }
                    }
                }
            }

            HashSet<string> installedFileNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            foreach (string root in roots)
            {
                CollectFileNames(root, 4, installedFileNames);
            }

            foreach (DetectionRule rule in rules)
            {
                if (rule.MatchesRegistry(registryTexts) || rule.MatchesFilesystem(installedFileNames))
                {
                    detected.Add(rule.Id);
                }
            }

            System.Text.StringBuilder json = new System.Text.StringBuilder();
            json.Append("{\"detected\":[");
            for (int index = 0; index < detected.Count; index++)
            {
                if (index > 0)
                {
                    json.Append(',');
                }
                json.Append('"');
                json.Append(detected[index]);
                json.Append('"');
            }
            json.Append("]}");
            return json.ToString();
        }

        private static DetectionRule[] CreateDetectionRules()
        {
            return new DetectionRule[]
            {
                new DetectionRule("honkai-impact-3rd", new string[] { "崩坏3", "Honkai Impact 3rd" }, new string[] { "BH3.exe", "Honkai Impact 3rd.exe" }),
                new DetectionRule("genshin-impact", new string[] { "原神", "Genshin Impact" }, new string[] { "GenshinImpact.exe", "YuanShen.exe" }),
                new DetectionRule("honkai-star-rail", new string[] { "崩坏：星穹铁道", "崩坏:星穹铁道", "Honkai: Star Rail" }, new string[] { "StarRail.exe" }),
                new DetectionRule("zenless-zone-zero", new string[] { "绝区零", "Zenless Zone Zero" }, new string[] { "ZenlessZoneZero.exe" }),
                new DetectionRule("tears-of-themis", new string[] { "未定事件簿", "Tears of Themis" }, new string[] { "TearsOfThemis.exe" }),
                new DetectionRule("wuthering-waves", new string[] { "鸣潮", "Wuthering Waves" }, new string[] { "Wuthering Waves.exe" }),
                new DetectionRule("punishing-gray-raven", new string[] { "战双帕弥什", "Punishing: Gray Raven", "Punishing Gray Raven" }, new string[] { "PGR.exe", "PunishingGrayRaven.exe" }),
                new DetectionRule("arknights", new string[] { "明日方舟", "Arknights" }, new string[] { "Arknights.exe" }),
                new DetectionRule("arknights-endfield", new string[] { "明日方舟：终末地", "明日方舟:终末地", "Arknights: Endfield", "Arknights Endfield" }, new string[] { }),
                new DetectionRule("blue-archive", new string[] { "蔚蓝档案", "Blue Archive" }, new string[] { "BlueArchive.exe" }),
                new DetectionRule("azur-lane", new string[] { "碧蓝航线", "Azur Lane" }, new string[] { "AzurLane.exe" }),
                new DetectionRule("girls-frontline-2", new string[] { "少女前线2：追放", "少女前线2:追放", "GIRLS' FRONTLINE 2: EXILIUM" }, new string[] { "GF2.exe", "GirlsFrontline2.exe" }),
                new DetectionRule("reverse-1999", new string[] { "重返未来：1999", "重返未来:1999", "Reverse: 1999" }, new string[] { "Reverse1999.exe" }),
                new DetectionRule("snowbreak", new string[] { "尘白禁区", "Snowbreak" }, new string[] { "Snowbreak.exe" }),
                new DetectionRule("tower-of-fantasy", new string[] { "幻塔", "Tower of Fantasy" }, new string[] { "TowerOfFantasy.exe" }),
                new DetectionRule("aether-gazer", new string[] { "深空之眼", "Aether Gazer" }, new string[] { "AetherGazer.exe" }),
                new DetectionRule("infinite-nikki", new string[] { "无限暖暖", "Infinity Nikki" }, new string[] { "InfinityNikki.exe" }),
                new DetectionRule("love-and-deepspace", new string[] { "恋与深空", "Love and Deepspace" }, new string[] { "LoveAndDeepspace.exe" }),
                new DetectionRule("light-and-night", new string[] { "光与夜之恋", "Light and Night" }, new string[] { "LightAndNight.exe" }),
                new DetectionRule("onmyoji", new string[] { "阴阳师", "Onmyoji" }, new string[] { "Onmyoji.exe" }),
                new DetectionRule("fate-grand-order", new string[] { "命运-冠位指定", "Fate/Grand Order", "FGO" }, new string[] { "FGO.exe" }),
                new DetectionRule("princess-connect", new string[] { "公主连结Re:Dive", "Princess Connect Re:Dive" }, new string[] { "PrincessConnectReDive.exe" }),
                new DetectionRule("path-to-nowhere", new string[] { "无期迷途", "Path to Nowhere" }, new string[] { "PathToNowhere.exe" }),
                new DetectionRule("nikke", new string[] { "胜利女神：妮姬", "NIKKE" }, new string[] { "NIKKE.exe" })
            };
        }

        private static void CollectFileNames(string root, int depth, HashSet<string> fileNames)
        {
            if (!Directory.Exists(root) || depth < 0)
            {
                return;
            }

            try
            {
                foreach (string file in Directory.GetFiles(root))
                {
                    fileNames.Add(Path.GetFileName(file));
                }

                foreach (string directory in Directory.GetDirectories(root))
                {
                    string folderName = Path.GetFileName(directory);
                    if (folderName.IndexOf("Windows", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        folderName.IndexOf("Package", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        folderName.IndexOf("Microsoft", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        continue;
                    }

                    CollectFileNames(directory, depth - 1, fileNames);
                }
            }
            catch
            {
            }
        }

        private sealed class WallpaperRecord
        {
            public string Id;
            public string Title;
            public string Type;
            public string MediaPath;
            public string MediaType;
            public string PreviewPath;
        }

        private sealed class DetectionRule
        {
            public string Id { get; private set; }
            private readonly string[] names;
            private readonly string[] fileNames;

            public DetectionRule(string id, string[] names, string[] fileNames)
            {
                Id = id;
                this.names = names;
                this.fileNames = fileNames;
            }

            public bool MatchesRegistry(List<string> registryTexts)
            {
                foreach (string text in registryTexts)
                {
                    foreach (string name in names)
                    {
                        if (text.IndexOf(name, StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            if ((name == "Arknights" || name == "明日方舟") &&
                                (text.IndexOf("Endfield", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                 text.IndexOf("终末地", StringComparison.OrdinalIgnoreCase) >= 0))
                            {
                                continue;
                            }
                            return true;
                        }
                    }
                }
                return false;
            }

            public bool MatchesFilesystem(HashSet<string> installedFileNames)
            {
                foreach (string fileName in fileNames)
                {
                    if (installedFileNames.Contains(fileName))
                    {
                        return true;
                    }
                }
                return false;
            }
        }

        private static byte[] ReadResource(string relativePath)
        {
            string safeRelativePath = relativePath.Replace('\\', '/').TrimStart('/');
            string resourceName = "site." + safeRelativePath.Replace('/', '.');
            Stream resource = Assembly.GetExecutingAssembly().GetManifestResourceStream(resourceName);
            if (resource == null)
            {
                return null;
            }

            using (resource)
            using (MemoryStream memory = new MemoryStream())
            {
                resource.CopyTo(memory);
                return memory.ToArray();
            }
        }

        private static string GetContentType(string path)
        {
            string extension = Path.GetExtension(path).ToLowerInvariant();
            switch (extension)
            {
                case ".html": return "text/html; charset=utf-8";
                case ".js": return "text/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".svg": return "image/svg+xml";
                case ".png": return "image/png";
                case ".gif": return "image/gif";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".webp": return "image/webp";
                case ".mp4": return "video/mp4";
                case ".webm": return "video/webm";
                case ".ico": return "image/x-icon";
                case ".webmanifest": return "application/manifest+json; charset=utf-8";
                case ".json": return "application/json; charset=utf-8";
                default: return "application/octet-stream";
            }
        }

        private static void WriteRedirect(NetworkStream stream, string location)
        {
            string header =
                "HTTP/1.1 302 Found\r\n" +
                "Location: " + location + "\r\n" +
                "Content-Length: 0\r\n" +
                "Connection: close\r\n\r\n";
            byte[] headerBytes = Encoding.ASCII.GetBytes(header);
            stream.Write(headerBytes, 0, headerBytes.Length);
        }

        private static void WriteText(
            NetworkStream stream,
            int statusCode,
            string statusText,
            string contentType,
            string text,
            bool headOnly = false
        )
        {
            WriteResponse(stream, statusCode, statusText, contentType, Encoding.UTF8.GetBytes(text), headOnly, String.Empty);
        }

        private static void WriteResponse(
            NetworkStream stream,
            int statusCode,
            string statusText,
            string contentType,
            byte[] body,
            bool headOnly,
            string extraHeaders
        )
        {
            string header =
                "HTTP/1.1 " + statusCode + " " + statusText + "\r\n" +
                "Content-Type: " + contentType + "\r\n" +
                "Content-Length: " + body.Length + "\r\n" +
                "Cache-Control: no-cache, no-store, must-revalidate\r\n" +
                "Pragma: no-cache\r\n" +
                extraHeaders +
                "Connection: close\r\n\r\n";
            byte[] headerBytes = Encoding.ASCII.GetBytes(header);
            stream.Write(headerBytes, 0, headerBytes.Length);
            if (!headOnly)
            {
                stream.Write(body, 0, body.Length);
            }
        }
    }
}
