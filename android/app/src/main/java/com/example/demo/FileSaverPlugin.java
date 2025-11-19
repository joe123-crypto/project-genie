package com.example.demo;

import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;

@CapacitorPlugin(name = "FileSaver")
public class FileSaverPlugin extends Plugin {

    @PluginMethod
    public void saveBase64ToDownloads(PluginCall call) {
        String dataUrl = call.getString("dataUrl");

        if (dataUrl == null) {
            call.reject("dataUrl is required");
            return;
        }

        try {
            // 1. Detect MIME type and file extension
            String mimeType = dataUrl.substring(dataUrl.indexOf(":") + 1, dataUrl.indexOf(";"));
            String fileExt;
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
                default:
                    fileExt = ".bin"; // fallback
            }

            // 2. Generate filename
            String filename = "genie_" + System.currentTimeMillis() + fileExt;

            // 3. Strip header and decode base64
            String base64Data = dataUrl.substring(dataUrl.indexOf(",") + 1);
            byte[] fileBytes = Base64.decode(base64Data, Base64.DEFAULT);

            // 4. Save to Downloads using MediaStore (Android 10+) or legacy method (older versions)
            Context context = getContext();
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Use MediaStore for Android 10+ (API 29+)
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                values.put(MediaStore.MediaColumns.IS_PENDING, 1);

                Uri collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
                Uri itemUri = context.getContentResolver().insert(collection, values);

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

                JSObject result = new JSObject();
                result.put("filepath", itemUri.toString());
                call.resolve(result);
            } else {
                // Fallback for Android 9 and below - save to Pictures directory
                // Note: RELATIVE_PATH is not available on API < 29
                ContentValues values = new ContentValues();
                values.put(MediaStore.Images.Media.DISPLAY_NAME, filename);
                values.put(MediaStore.Images.Media.MIME_TYPE, mimeType);
                // For older Android versions, save to Pictures directory
                // The path will be determined by the system

                Uri collection = MediaStore.Images.Media.EXTERNAL_CONTENT_URI;
                Uri itemUri = context.getContentResolver().insert(collection, values);

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

                JSObject result = new JSObject();
                result.put("filepath", itemUri.toString());
                call.resolve(result);
            }

        } catch (Exception e) {
            call.reject("Error saving file: " + e.getMessage());
        }
    }
}
