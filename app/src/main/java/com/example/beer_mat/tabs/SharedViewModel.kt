package com.example.beer_mat.tabs

import androidx.compose.runtime.mutableStateListOf
import androidx.lifecycle.ViewModel

data class FoodItem(val name: String, val price: Double)
data class DrinkItem(val name: String, val price: Double)
data class Member(val name: String, val totalAmount: Double = 0.0)

class SharedViewModel: ViewModel() {

    val foodList = mutableStateListOf(
        FoodItem("Hot Dog", 2.00),
        FoodItem("Bratwurst", 2.00),
        FoodItem("Paar Bratwürste", 3.00),
        FoodItem("Steak", 3.50),
        FoodItem("Kuchen", 1.00)
    )

    val drinkList = mutableStateListOf(
        DrinkItem("Mineralwasser", 1.50),
        DrinkItem("Cola Mix", 2.00),
        DrinkItem("Iso Sport", 2.00),
        DrinkItem("Bio Apfel-Birnen-Schorle", 2.00),
        DrinkItem("Bier", 2.50),
        DrinkItem("Radler", 2.50),
        DrinkItem("Alkoholfreies Bier", 2.50),
        DrinkItem("Alkoholfreies Radler", 2.50),
        DrinkItem("Kaffee", 1.50),
    )

    val members = mutableStateListOf<Member>()

    fun addMember(name: String) {
        members.add(Member(name))
    }

    fun addPurchase(memberName: String, price: Double) {
        val memberIndex = members.indexOfFirst { it.name == memberName }
        if (memberIndex != -1) {
            val member = members[memberIndex]
            members[memberIndex] = member.copy(totalAmount = member.totalAmount + price)
        }
    }
}