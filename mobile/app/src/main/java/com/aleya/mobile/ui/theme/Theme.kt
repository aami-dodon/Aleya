package com.aleya.mobile.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val LightColors = lightColorScheme(
    primary = MeadowCanopy,
    onPrimary = MoonMoss,
    secondary = MistFern,
    background = MoonMoss,
    onBackground = NightBark,
    surface = MoonMoss,
    onSurface = NightBark
)

private val DarkColors = darkColorScheme(
    primary = DewGlow,
    onPrimary = NightBark,
    secondary = MistFern,
    background = NightBark,
    onBackground = MoonMoss,
    surface = NightBark,
    onSurface = MoonMoss
)

@Composable
fun AleyaMobileTheme(
    useDarkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (useDarkTheme) DarkColors else LightColors

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
