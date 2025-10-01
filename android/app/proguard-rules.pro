# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# ------------------------------------------------------------------
# Google Play Billing Library Rules
# ------------------------------------------------------------------

# Keep all classes in the billing client API
-keep class com.android.billingclient.api.** { *; }

# Keep Google Play services common classes
-keep class com.google.android.gms.common.** { *; }

# Keep Google Tasks classes
-keep class com.google.android.gms.tasks.** { *; }

# Keep billing related classes to prevent obfuscation
-keep class * implements com.android.billingclient.api.** { *; }

# Keep purchase related classes
-keep class * extends com.android.billingclient.api.Purchase { *; }

# Keep product details classes
-keep class * extends com.android.billingclient.api.ProductDetails { *; }

# Keep billing result classes
-keep class * extends com.android.billingclient.api.BillingResult { *; }

# ------------------------------------------------------------------
# Capacitor Rules (Recommended)
# ------------------------------------------------------------------

# Keep Capacitor classes
-keep class io.michaelrocks.paranoid.Obfuscate { *; }
-keep class com.getcapacitor.** { *; }
-keep class androidx.appcompat.** { *; }

# Keep JavaScript interface classes
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Cordova plugins if you have any
-keep class org.apache.cordova.** { *; }
-keep public class * extends org.apache.cordova.CordovaPlugin

# ------------------------------------------------------------------
# General AndroidX Rules
# ------------------------------------------------------------------

# Keep parcelable classes
-keep class * implements android.os.Parcelable {
  public static final android.os.Parcelable$Creator *;
}

# Keep serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep enum types
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}