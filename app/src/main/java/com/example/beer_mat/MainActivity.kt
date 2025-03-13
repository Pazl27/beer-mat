package com.example.beer_mat

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.example.beer_mat.components.AddFloatingActionButton
import com.example.beer_mat.database.AppDatabase
import com.example.beer_mat.database.DrinkItem
import com.example.beer_mat.database.FoodItem
import com.example.beer_mat.database.Member
import com.example.beer_mat.tabs.drinks.DrinksScreen
import com.example.beer_mat.tabs.food.FoodScreen
import com.example.beer_mat.tabs.members.MembersScreen
import com.example.beer_mat.ui.theme.BeerMatTheme
import kotlinx.coroutines.*

class MainActivity : ComponentActivity() {
    private val applicationScope = CoroutineScope(SupervisorJob())
    private lateinit var database: AppDatabase

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        database = AppDatabase.getDatabase(this, applicationScope)

        setContent {
            BeerMatTheme {
                MainScreen(database)
            }
        }
    }
}

@Composable
fun MainScreen(database: AppDatabase) {
    var selectedTabIndex by remember { mutableIntStateOf(0) }
    val tabs = listOf("Food", "Drinks", "Members")
    var showDialog by remember { mutableStateOf(false) }

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
        },
        floatingActionButton = {
            AddFloatingActionButton(onClick = { showDialog = true }, selectedTabIndex = selectedTabIndex)
        }
    ) { innerPadding ->
        when (selectedTabIndex) {
            0 -> FoodScreen(database, Modifier.padding(innerPadding))
            1 -> DrinksScreen(database, Modifier.padding(innerPadding))
            2 -> MembersScreen(database, Modifier.padding(innerPadding))
        }
    }

    if (showDialog) {
        AddItemDialog(
            onDismiss = { showDialog = false },
            onAddItem = { name, price ->
                when (selectedTabIndex) {
                    0 -> {
                        val newItem = FoodItem(name = name, price = price)
                        CoroutineScope(Dispatchers.IO).launch {
                            database.foodDao().insert(newItem)
                        }
                    }
                    1 -> {
                        val newItem = DrinkItem(name = name, price = price)
                        CoroutineScope(Dispatchers.IO).launch {
                            database.drinkDao().insert(newItem)
                        }
                    }
                    2 -> {
                        val newItem = Member(name = name, amountToPay = price)
                        CoroutineScope(Dispatchers.IO).launch {
                            database.memberDao().insert(newItem)
                        }
                    }
                }
                showDialog = false
            }
        )
    }
}

@Composable
fun AddItemDialog(onDismiss: () -> Unit, onAddItem: (String, Double) -> Unit) {
    var name by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Item") },
        text = {
            Column {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") }
                )
                OutlinedTextField(
                    value = price,
                    onValueChange = { price = it },
                    label = { Text("Price") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )
            }
        },
        confirmButton = {
            Button(onClick = {
                val priceValue = price.toDoubleOrNull() ?: 0.0
                onAddItem(name, priceValue)
            }) {
                Text("Add")
            }
        },
        dismissButton = {
            Button(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}