package com.example.demo;

import android.Manifest;
import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.OutputStream;

@CapacitorPlugin(
    name = "FileSaver",
    permissions = {
        @Permission(
            alias = "storage",
            strings = {
                Manifest.permission.READ_EXTERNAL_STORAGE,
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            }
        )
    }
)
public class FileSaverPlugin extends Plugin {

    private static final String TAG = "FileSaver";

    @PluginMethod
    public void saveBase64ToDownloads(PluginCall call) {
        String dataUrl = call.getString("dataUrl");

        if (dataUrl == null) {
            call.reject("dataUrl is required");
            return;
        }

        // For Android 10+ (API 29+), we don't need WRITE_EXTERNAL_STORAGE for MediaStore downloads
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            saveFile(call, dataUrl);
        } else {
            // For older Android versions, we need permission
            if (getPermissionState("storage") != PermissionState.GRANTED) {
                requestPermissionForAlias("storage", call, "storagePermsCallback");
            } else {
                saveFile(call, dataUrl);
            }
        }
    }

    @PermissionCallback
    private void storagePermsCallback(PluginCall call) {
        if (getPermissionState("storage") == PermissionState.GRANTED) {
            String dataUrl = call.getString("dataUrl");
            saveFile(call, dataUrl);
        } else {
            call.reject("Storage permission is required to save images on this device version.");
        }
    }

    private void saveFile(PluginCall call, String dataUrl) {
        try {
            // 1. Detect MIME type and file extension
            String mimeType = "application/octet-stream";
            String fileExt = ".bin";

            if (dataUrl.contains("data:") && dataUrl.contains(";base64,")) {
                String header = dataUrl.substring(0, dataUrl.indexOf(";base64,"));
                if (header.contains(":")) {
                    mimeType = header.substring(header.indexOf(":") + 1);
                }
            }

            switch (mimeType) {
                case "image/png":
                    fileExt = ".png";
                    break;
                case "image/jpeg":
                case "image/jpg":
                    fileExt = ".jpg";
                    break;
                case "image/webp":
                    fileExt = ".webp";
                    break;
            }

            // 2. Generate filename
            String filename = "genie_" + System.currentTimeMillis() + fileExt;

            // 3. Strip header and decode base64
            String base64Data = dataUrl;
            if (dataUrl.contains(",")) {
                base64Data = dataUrl.substring(dataUrl.indexOf(",") + 1);
            }
            
            byte[] fileBytes;
            try {
                fileBytes = Base64.decode(base64Data, Base64.DEFAULT);
            } catch (IllegalArgumentException e) {
                call.reject("Invalid Base64 data");
                return;
            }

            // 4. Save to Downloads using MediaStore (Android 10+) or legacy method (older versions)
            Context context = getContext();
            Uri itemUri = null;
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Use MediaStore for Android 10+ (API 29+)
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                values.put(MediaStore.MediaColumns.IS_PENDING, 1);

                Uri collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
                itemUri = context.getContentResolver().insert(collection, values);

                if (itemUri == null) {
                    call.reject("Failed to create new MediaStore record.");
                    return;
                }

                try (OutputStream os = context.getContentResolver().openOutputStream(itemUri)) {
                    if (os == null) {
                        throw new Exception("Failed to open output stream.");
                    }
                    os.write(fileBytes);
                }

                // Mark as not pending
                values.clear();
                values.put(MediaStore.MediaColumns.IS_PENDING, 0);
                context.getContentResolver().update(itemUri, values, null, null);

            } else {
                // Fallback for Android 9 and below - save to Pictures directory
                // Note: RELATIVE_PATH is not available on API < 29
                ContentValues values = new ContentValues();
                values.put(MediaStore.Images.Media.DISPLAY_NAME, filename);
                values.put(MediaStore.Images.Media.MIME_TYPE, mimeType);
                // For older Android versions, save to Pictures directory
                // The path will be determined by the system

                Uri collection = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                itemUri = context.getContentResolver().insert(collection, values);

                if (itemUri == null) {
                    call.reject("Failed to create new MediaStore record.");
                    return;
                }

                try (OutputStream os = context.getContentResolver().openOutputStream(itemUri)) {
                    if (os == null) {
                        throw new Exception("Failed to open output stream.");
                    }
                    os.write(fileBytes);
                }
            }

            JSObject result = new JSObject();
            result.put("filepath", itemUri != null ? itemUri.toString() : "");
            result.put("success", true);
            call.resolve(result);

        } catch (Exception e) {
            Log.e(TAG, "Error saving file", e);
            call.reject("Error saving file: " + e.getMessage());
        }
    }
}
