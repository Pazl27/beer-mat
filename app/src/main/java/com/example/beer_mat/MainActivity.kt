package com.example.beer_mat

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.example.beer_mat.ui.theme.BeerMatTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            BeerMatTheme {
                MainScreen()
            }
        }
    }
}

@Composable
fun MainScreen() {
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    val tabs = listOf("Food", "Drinks", "Members")

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            TabRow(
                selectedTabIndex = selectedTabIndex,
                modifier = Modifier.padding(top = 10.dp)
            ) {
                tabs.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTabIndex == index,
                        onClick = { selectedTabIndex = index },
                        text = { Text(title) }
                    )
                }
            }
        }
    ) { innerPadding ->
        when (selectedTabIndex) {
            0 -> FoodScreen(Modifier.padding(innerPadding))
            1 -> DrinksScreen(Modifier.padding(innerPadding))
            2 -> MembersScreen(Modifier.padding(innerPadding))
        }
    }
}

@Composable
fun FoodScreen(modifier: Modifier = Modifier) {
    Text(text = "Food Content", modifier = modifier)
}

@Composable
fun DrinksScreen(modifier: Modifier = Modifier) {
    Text(text = "Drinks Content", modifier = modifier)
}

@Composable
fun MembersScreen(modifier: Modifier = Modifier) {
    Text(text = "Members Content", modifier = modifier)
}

@Preview(showBackground = true)
@Composable
fun MainScreenPreview() {
    BeerMatTheme {
        MainScreen()
    }
}