"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Http } from "@capacitor-community/http";
import { FileOpener } from '@capacitor-community/file-opener';

interface ReleaseAsset {
    name: string;
    browser_download_url: string;
}

const UpdateChecker = () => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [latestVersion, setLatestVersion] = useState<string | null>(null);
    const [updateUrl, setUpdateUrl] = useState<string | null>(null);
    const [releaseNotes, setReleaseNotes] = useState<string | null>(null);
    const [apkUrl, setApkUrl] = useState<string | null>(null);

    // Download states
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    useEffect(() => {
        const checkUpdate = async () => {
            console.log('[UpdateChecker] Component mounted, checking platform...');

            if (!Capacitor.isNativePlatform()) {
                console.log('[UpdateChecker] Not a native platform, skipping update check');
                return;
            }

            console.log('[UpdateChecker] Native platform detected, proceeding with update check');

            const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION;
            const repo = process.env.NEXT_PUBLIC_GITHUB_REPO;

            console.log('[UpdateChecker] Config:', { currentVersion, repo });

            if (!currentVersion || !repo) {
                console.warn("UpdateChecker: Missing configuration");
                return;
            }

            try {
                console.log(`[UpdateChecker] Fetching latest release from GitHub: ${repo}`);
                const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);

                console.log(`[UpdateChecker] GitHub API response status: ${res.status}`);

                if (!res.ok) {
                    if (res.status === 404) {
                        console.log('[UpdateChecker] No releases found (404)');
                        return;
                    }
                    throw new Error(`GitHub API error: ${res.status}`);
                }

                const data = await res.json();
                const tagName = data.tag_name;
                const remoteVersion = tagName.replace(/^v/, "");

                console.log(`[UpdateChecker] Current version: ${currentVersion}, Remote version: ${remoteVersion}`);

                if (compareVersions(remoteVersion, currentVersion) > 0) {
                    console.log('[UpdateChecker] Update available! Showing modal');

                    // Find APK in release assets
                    const apkAsset = data.assets?.find((asset: ReleaseAsset) =>
                        asset.name.endsWith('.apk')
                    );

                    if (apkAsset) {
                        console.log('[UpdateChecker] APK found:', apkAsset.name);
                        setApkUrl(apkAsset.browser_download_url);
                    } else {
                        console.warn('[UpdateChecker] No APK file found in release assets');
                    }

                    setLatestVersion(remoteVersion);
                    setUpdateUrl(data.html_url);
                    setReleaseNotes(data.body);
                    setUpdateAvailable(true);
                } else {
                    console.log('[UpdateChecker] App is up to date');
                }
            } catch (error) {
                console.error("[UpdateChecker] Failed to check for updates:", error);
            }
        };

        checkUpdate();
    }, []);

    const downloadAndInstallAPK = async () => {
        if (!apkUrl) {
            setDownloadError('No APK file available for download');
            return;
        }

        setIsDownloading(true);
        setDownloadError(null);
        setDownloadProgress(0);

        try {
            console.log('[UpdateChecker] Starting APK download:', apkUrl);

            // Setup progress listener
            const progressListener = await Http.addListener('progress', (progress: any) => {
                if (progress.total > 0) {
                    const percent = (progress.loaded / progress.total) * 100;
                    setDownloadProgress(Math.round(percent));
                }
            });

            // Download the APK file
            const response = await Http.downloadFile({
                url: apkUrl,
                filePath: 'app-update.apk',
                fileDirectory: Directory.Cache,
                method: 'GET',
                connectTimeout: 30000,
                readTimeout: 30000,
                params: {}, // Required to prevent NullPointerException on Android
                headers: {}, // Required to prevent NullPointerException on Android (setRequestHeaders)
                progress: true
            });

            // Clean up listener
            progressListener.remove();

            console.log('[UpdateChecker] Download complete:', response.path);

            // Get the file URI
            const fileUri = await Filesystem.getUri({
                directory: Directory.Cache,
                path: 'app-update.apk'
            });

            console.log('[UpdateChecker] File URI:', fileUri.uri);

            // Trigger installation using native Android intent
            if (Capacitor.getPlatform() === 'android') {
                try {
                    await FileOpener.open({
                        filePath: fileUri.uri,
                        contentType: 'application/vnd.android.package-archive'
                    });
                    console.log('[UpdateChecker] Install prompt triggered via FileOpener');
                } catch (err) {
                    console.error('[UpdateChecker] Failed to open APK:', err);
                    setDownloadError('Failed to open installation file.');
                }
            }

            setIsDownloading(false);
            // Don't close the modal immediately - let user see completion

        } catch (error) {
            console.error('[UpdateChecker] Download failed:', error);
            setDownloadError('Failed to download update. Please try again.');
            setIsDownloading(false);
        }
    };

    if (!updateAvailable) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">Update Available 🚀</h2>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                            v{latestVersion}
                        </span>
                    </div>

                    {!isDownloading ? (
                        <>
                            <p className="text-gray-300 mb-4">
                                A new version of GenAIe is available! Update now to get the latest features and fixes.
                            </p>

                            {releaseNotes && (
                                <div className="bg-gray-800/50 rounded-lg p-3 mb-6 max-h-40 overflow-y-auto text-sm text-gray-400 border border-gray-700/50">
                                    <p className="font-semibold text-gray-300 mb-1">What&apos;s New:</p>
                                    <div className="whitespace-pre-wrap">{releaseNotes}</div>
                                </div>
                            )}

                            {downloadError && (
                                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                                    <p className="text-red-400 text-sm">{downloadError}</p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setUpdateAvailable(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors hover:bg-gray-800 rounded-lg"
                                >
                                    Dismiss
                                </button>
                                {apkUrl ? (
                                    <button
                                        onClick={downloadAndInstallAPK}
                                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors rounded-lg shadow-lg shadow-blue-900/20"
                                    >
                                        Download & Install
                                    </button>
                                ) : (
                                    <a
                                        href={updateUrl || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors rounded-lg text-center shadow-lg shadow-blue-900/20"
                                    >
                                        View Release
                                    </a>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="py-4">
                            <div className="flex items-center justify-center mb-4">
                                <div className="relative w-24 h-24">
                                    {/* Circular progress */}
                                    <svg className="w-24 h-24 transform -rotate-90">
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            className="text-gray-700"
                                        />
                                        <circle
                                            cx="48"
                                            cy="48"
                                            r="40"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 40}`}
                                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - downloadProgress / 100)}`}
                                            className="text-blue-500 transition-all duration-300"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-white">{downloadProgress}%</span>
                                    </div>
                                </div>
                            </div>

                            <p className="text-center text-gray-300 mb-2">Downloading update...</p>
                            <p className="text-center text-gray-500 text-sm">Please wait while we download the latest version</p>

                            {/* Progress bar */}
                            <div className="mt-4 bg-gray-800 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full transition-all duration-300 ease-out"
                                    style={{ width: `${downloadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
function compareVersions(v1: string, v2: string): number {
    const p1 = v1.split(".").map(Number);
    const p2 = v2.split(".").map(Number);

    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
        const n1 = p1[i] || 0;
        const n2 = p2[i] || 0;
        if (n1 > n2) return 1;
        if (n1 < n2) return -1;
    }
    return 0;
}

export default UpdateChecker;
