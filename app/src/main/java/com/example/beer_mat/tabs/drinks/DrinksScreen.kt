package com.example.beer_mat.tabs.drinks

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.beer_mat.database.AppDatabase
import com.example.beer_mat.database.DrinkItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Composable
fun DrinksScreen(database: AppDatabase, modifier: Modifier = Modifier) {
    var drinksList by remember { mutableStateOf<List<DrinkItem>>(emptyList()) }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        coroutineScope.launch(Dispatchers.IO) {
            val drinkItems = database.drinkDao().getAllDrinkItems()
            drinksList = drinkItems
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            Text(
                text = "Drink Items",
                style = MaterialTheme.typography.headlineLarge,
                modifier = Modifier.padding(16.dp)
            )

            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(drinksList) { drink ->
                    DrinkItemRow(drink)
                }
            }
        }
    }
}

@Composable
fun DrinkItemRow(drink: DrinkItem) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = drink.name, modifier = Modifier.weight(1f))
            Text(text = "${drink.price} €", style = MaterialTheme.typography.bodyMedium)
        }
    }
}