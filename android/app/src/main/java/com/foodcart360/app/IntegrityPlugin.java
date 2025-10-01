package com.foodcart360.app;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.android.play.core.integrity.IntegrityManager;
import com.google.android.play.core.integrity.IntegrityManagerFactory;
import com.google.android.play.core.integrity.IntegrityTokenRequest;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "IntegrityPlugin")
public class IntegrityPlugin extends Plugin {

    private static final String TAG = "IntegrityPlugin";
    private final Executor executor = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void checkIntegrity(PluginCall call) {
        IntegrityManager integrityManager = IntegrityManagerFactory.create(getContext());

        // Use a secure nonce
        String nonce = java.util.UUID.randomUUID().toString();

        IntegrityTokenRequest request = IntegrityTokenRequest.builder()
                .setNonce(nonce)
                .build();

        integrityManager.requestIntegrityToken(request)
                .addOnSuccessListener(executor, response -> {
                    String token = response.token();
                    Log.d(TAG, "Integrity token: " + token);

                    // Return success with token and isSafe flag
                    JSObject result = JSObjectBuilder.success(true);
                    result.put("token", token);
                    call.resolve(result);
                })
                .addOnFailureListener(executor, e -> {
                    Log.e(TAG, "Integrity check failed: " + e.getMessage(), e);
                    call.resolve(JSObjectBuilder.success(false));
                });
    }

    static class JSObjectBuilder {
        static JSObject success(boolean result) {
            JSObject obj = new JSObject();
            obj.put("isSafe", result);
            return obj;
        }
    }
}