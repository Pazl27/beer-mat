package com.example.beer_mat.tabs.food

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.unit.dp
import com.example.beer_mat.components.AddFloatingActionButton
import com.example.beer_mat.components.ShowAddingFoodToMemberDialog
import com.example.beer_mat.components.ShowAddingNewFoodToListDialog
import com.example.beer_mat.tabs.FoodItem
import com.example.beer_mat.tabs.SharedViewModel

@Composable
fun FoodScreen(viewModel: SharedViewModel, modifier: Modifier = Modifier) {

    var showAddingNewFoodToListDialog by remember { mutableStateOf(false) }
    var showAddingFoodToMember by remember { mutableStateOf(false) }
    var selectedFoodItem by remember { mutableStateOf<FoodItem?>(null) }
    var selectedAmount by remember { mutableStateOf(0) }
    val foodList = viewModel.foodList

    Box(modifier = modifier.fillMaxSize()) {
        Column(modifier = Modifier.fillMaxSize()) {
            Text(
                text = "Food Items",
                style = MaterialTheme.typography.headlineLarge,
                modifier = Modifier.padding(16.dp)
            )

            // Display the food list
            LazyColumn(modifier = Modifier.fillMaxSize()) {
                itemsIndexed(foodList) { index, food ->
                    FoodItemRow(food)
                }
            }
        }
    }

    // Floating action button to add completely new food item
    Box(modifier = modifier.fillMaxSize()) {
        Text(text = "Food Content", modifier = Modifier.align(Alignment.TopStart))
        AddFloatingActionButton().Content(
            modifier = Modifier.align(Alignment.BottomEnd),
            onClick = {
                showAddingNewFoodToListDialog = true
            }
        )
    }

    ShowAddingNewFoodToListDialog(
        // todo: implement right logic - edit foodlist
    )

    // ShowDialog for selecting amount of the selected food item
    selectedFoodItem?.let { food ->
        ShowAddingFoodToMemberDialog(
            // todo: Implement adding logic here (e.g., select member, add item with price)
            //  1 - open dialog with selecting amount
            //  2 - open dialog with selecting right member
        )
    }
}

// Display food list
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
            Text(text = "$${food.price}", style = MaterialTheme.typography.bodyMedium)
        }
    }
}