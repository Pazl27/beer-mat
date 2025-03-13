package com.example.beer_mat.tabs.food

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.beer_mat.database.AppDatabase
import com.example.beer_mat.database.FoodItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Composable
fun FoodScreen(database: AppDatabase, modifier: Modifier = Modifier) {
    var foodList by remember { mutableStateOf<List<FoodItem>>(emptyList()) }
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(Unit) {
        coroutineScope.launch(Dispatchers.IO) {
            val foodItems = database.foodDao().getAllFoodItems()
            foodList = foodItems
        }
    }

    Box(modifier = modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            Text(
                text = "Food Items",
                style = MaterialTheme.typography.headlineLarge,
                modifier = Modifier.padding(16.dp)
            )

            LazyColumn(modifier = Modifier.fillMaxSize()) {
                items(foodList) { food ->
                    FoodItemRow(food)
                }
            }
        }
    }
}

@Composable
fun FoodItemRow(food: FoodItem) {
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
            Text(text = food.name, modifier = Modifier.weight(1f))
            Text(text = "${food.price} €", style = MaterialTheme.typography.bodyMedium)
        }
    }
}