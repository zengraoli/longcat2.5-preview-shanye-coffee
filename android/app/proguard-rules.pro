# kotlinx.serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}

-keep,includedescriptorclasses class com.shanyecoffee.app.**$$serializer { *; }
-keepclassmembers class com.shanyecoffee.app.** {
    *** Companion;
}
-keepclasseswithmembers class com.shanyecoffee.app.** {
    kotlinx.serialization.KSerializer serializer(...);
}
