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
import com.example.beer_mat.tabs.SharedViewModel
import com.example.beer_mat.tabs.drinks.DrinksScreen
import com.example.beer_mat.tabs.food.FoodScreen
import com.example.beer_mat.tabs.members.MembersScreen
import com.example.beer_mat.ui.theme.BeerMatTheme
import androidx.lifecycle.viewmodel.compose.viewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            BeerMatTheme {
                val viewModel: SharedViewModel = viewModel()
                MainScreen(viewModel)
            }
        }
    }
}

@Composable
fun MainScreen(viewModel: SharedViewModel) {
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    val tabs = listOf("Food", "Drinks", "Members")

    val foodScreen = remember { FoodScreen(viewModel) }
    val drinksScreen = remember { DrinksScreen(viewModel) }
    val membersScreen = remember { MembersScreen(viewModel) }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            TabRow(
                selectedTabIndex = selectedTabIndex,
                modifier = Modifier.padding(top = 30.dp)
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
            0 -> foodScreen.Content(Modifier.padding(innerPadding))
            1 -> drinksScreen.Content(Modifier.padding(innerPadding))
            2 -> membersScreen.Content(Modifier.padding(innerPadding))
        }
    }
}

@Preview(showBackground = true)
@Composable
fun MainScreenPreview() {
    val fakeViewModel = SharedViewModel()
    BeerMatTheme {
        MainScreen(fakeViewModel)
    }
}