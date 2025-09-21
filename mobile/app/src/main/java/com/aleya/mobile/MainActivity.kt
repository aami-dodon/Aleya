package com.aleya.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.aleya.mobile.ui.theme.AleyaMobileTheme
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AleyaMobileTheme {
                AleyaMobileApp()
            }
        }
    }
}

@Composable
fun AleyaMobileApp() {
    AleyaBackground {
        AleyaHomeScreen()
    }
}

@Composable
private fun AleyaBackground(content: @Composable () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    listOf(
                        Color(0xFF0B2520),
                        Color(0xFF163C32),
                        Color(0xFF3E7C65)
                    )
                )
            )
    ) {
        content()
    }
}

@Composable
fun AleyaHomeScreen(
    viewModel: PromptViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        containerColor = Color.Transparent,
        topBar = {
            Surface(
                color = Color.Transparent,
                tonalElevation = 0.dp
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 32.dp, bottom = 16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Surface(
                        modifier = Modifier
                            .background(Color.Transparent),
                        shape = CircleShape,
                        color = Color.White.copy(alpha = 0.12f)
                    ) {
                        androidx.compose.foundation.Image(
                            painter = painterResource(id = R.drawable.ic_launcher_foreground),
                            contentDescription = null,
                            modifier = Modifier
                                .padding(24.dp)
                        )
                    }
                    Text(
                        text = stringResource(id = R.string.slogan),
                        style = MaterialTheme.typography.headlineSmall,
                        color = Color.White,
                        textAlign = TextAlign.Center
                    )
                }
            }
        },
        bottomBar = {
            SessionSummaryBar(completedSessions = uiState.completedSessions)
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(horizontal = 24.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            DailyFocusCard(
                prompt = uiState.prompt,
                onRequestNextPrompt = viewModel::nextPrompt,
                onLogReflection = viewModel::logReflection
            )

            AffirmationCard(
                affirmation = uiState.affirmation,
                onRequestNextAffirmation = viewModel::nextAffirmation
            )

            ReflectionHistorySection(history = uiState.history)
        }
    }
}

private const val MaxHistoryItems = 10

data class ReflectionEntry(
    val id: Long,
    val prompt: String,
    val affirmation: String,
    val completedAtMillis: Long
)

data class ReflectionUiState(
    val prompt: String,
    val affirmation: String,
    val history: List<ReflectionEntry>,
    val completedSessions: Int
)

class PromptViewModel : ViewModel() {
    private val prompts = listOf(
        "What gentle whisper from today deserves a moment of gratitude?",
        "Which sprouting idea would you like to nurture tomorrow?",
        "Where did you notice kindness growing around you today?",
        "How can you invite more rest into the grove you tend?",
        "Which relationship feels ready for a little more sunlight?"
    )

    private val affirmations = listOf(
        "I am rooted, radiant, and ready to bloom.",
        "Every breath guides me closer to calm clarity.",
        "My curiosity lights pathways through the grove.",
        "I carry wisdom gathered from every shared story.",
        "This pause is fertile ground for what comes next."
    )

    private var promptIndex = 0
    private var affirmationIndex = 0
    private val history = mutableListOf<ReflectionEntry>()

    private val _uiState = MutableStateFlow(
        ReflectionUiState(
            prompt = prompts.first(),
            affirmation = affirmations.first(),
            history = emptyList(),
            completedSessions = 0
        )
    )
    val uiState: StateFlow<ReflectionUiState> = _uiState.asStateFlow()

    fun nextPrompt() {
        promptIndex = (promptIndex + 1) % prompts.size
        _uiState.update { current ->
            current.copy(prompt = prompts[promptIndex])
        }
    }

    fun nextAffirmation() {
        affirmationIndex = (affirmationIndex + 1) % affirmations.size
        _uiState.update { current ->
            current.copy(affirmation = affirmations[affirmationIndex])
        }
    }

    fun logReflection() {
        val entry = ReflectionEntry(
            id = System.currentTimeMillis(),
            prompt = _uiState.value.prompt,
            affirmation = _uiState.value.affirmation,
            completedAtMillis = System.currentTimeMillis()
        )
        history.add(0, entry)
        if (history.size > MaxHistoryItems) {
            history.removeLast()
        }
        _uiState.update { current ->
            current.copy(
                history = history.toList(),
                completedSessions = current.completedSessions + 1
            )
        }
        nextPrompt()
        nextAffirmation()
    }
}

@Composable
private fun DailyFocusCard(
    prompt: String,
    onRequestNextPrompt: () -> Unit,
    onLogReflection: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color.White.copy(alpha = 0.08f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = stringResource(id = R.string.daily_focus),
                style = MaterialTheme.typography.titleMedium,
                color = Color(0xFFB3E7D8)
            )
            Text(
                text = prompt,
                style = MaterialTheme.typography.bodyLarge,
                color = Color.White,
                textAlign = TextAlign.Start
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    modifier = Modifier.weight(1f),
                    onClick = onLogReflection,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF5AA086))
                ) {
                    Text(
                        text = stringResource(id = R.string.log_reflection),
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold
                    )
                }
                Button(
                    modifier = Modifier.weight(1f),
                    onClick = onRequestNextPrompt,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF315C4B))
                ) {
                    Text(
                        text = stringResource(id = R.string.refresh_prompt),
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }
        }
    }
}

@Composable
private fun AffirmationCard(
    affirmation: String,
    onRequestNextAffirmation: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color.White.copy(alpha = 0.08f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = stringResource(id = R.string.affirmation_title),
                style = MaterialTheme.typography.titleMedium,
                color = Color(0xFFB3E7D8)
            )
            Text(
                text = affirmation,
                style = MaterialTheme.typography.bodyLarge,
                color = Color.White,
                textAlign = TextAlign.Start
            )
            Button(
                modifier = Modifier.fillMaxWidth(),
                onClick = onRequestNextAffirmation,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0B2520))
            ) {
                Text(
                    text = stringResource(id = R.string.affirmation_refresh),
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

@Composable
private fun ReflectionHistorySection(
    history: List<ReflectionEntry>,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = Color.White.copy(alpha = 0.05f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = stringResource(id = R.string.history_title),
                style = MaterialTheme.typography.titleMedium,
                color = Color(0xFFB3E7D8)
            )

            if (history.isEmpty()) {
                Text(
                    text = stringResource(id = R.string.history_empty),
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White.copy(alpha = 0.8f)
                )
            } else {
                history.forEachIndexed { index, entry ->
                    ReflectionHistoryEntry(entry = entry)
                    if (index != history.lastIndex) {
                        Divider(color = Color.White.copy(alpha = 0.08f))
                    }
                }
            }
        }
    }
}

@Composable
private fun ReflectionHistoryEntry(entry: ReflectionEntry) {
    val formattedTime = remember(entry.completedAtMillis) {
        val formatter = SimpleDateFormat("MMM d • h:mm a", Locale.getDefault())
        formatter.format(Date(entry.completedAtMillis))
    }

    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Text(
            text = formattedTime,
            style = MaterialTheme.typography.labelMedium,
            color = Color.White.copy(alpha = 0.7f)
        )
        Text(
            text = entry.prompt,
            style = MaterialTheme.typography.bodyMedium,
            color = Color.White
        )
        Text(
            text = entry.affirmation,
            style = MaterialTheme.typography.bodySmall,
            color = Color.White.copy(alpha = 0.8f)
        )
    }
}

@Composable
private fun SessionSummaryBar(
    completedSessions: Int,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier.fillMaxWidth(),
        color = Color.White.copy(alpha = 0.06f)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp, vertical = 16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = stringResource(id = R.string.session_count, completedSessions),
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.White,
                    fontWeight = FontWeight.SemiBold
                )
                Text(
                    text = stringResource(id = R.string.session_subtitle),
                    style = MaterialTheme.typography.bodySmall,
                    color = Color.White.copy(alpha = 0.8f)
                )
            }
        }
    }
}
