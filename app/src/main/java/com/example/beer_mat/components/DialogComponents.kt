package com.example.beer_mat.components

import android.app.AlertDialog
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

@Composable
fun ShowDialog(showDialog: Boolean, title: String, message: String, onDismiss: () -> Unit) {
    val context = LocalContext.current

    if (showDialog) {
        val builder = AlertDialog.Builder(context)
        builder.setTitle(title).setMessage(message)
        val dialog = builder.create()
        dialog.show()
        onDismiss()
    }
}

@Composable
fun ShowAddingNewFoodToListDialog(){
    // todo: implement right logic - edit foodlist and display
}

@Composable

fun ShowAddingFoodToMemberDialog(){
    // todo: Implement adding logic here (e.g., select member, add item with price)
}