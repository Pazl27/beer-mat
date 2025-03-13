package com.example.beer_mat.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query

@Dao
interface FoodDao {
    @Insert
    fun insert(foodItem: FoodItem)

    @Query("SELECT * FROM food")
    fun getAllFoodItems(): List<FoodItem>
}

@Dao
interface DrinkDao {
    @Insert
    fun insert(drinkItem: DrinkItem)

    @Query("SELECT * FROM drinks")
    fun getAllDrinkItems(): List<DrinkItem>
}

@Dao
interface MemberDao {
    @Insert
    fun insert(member: Member)

    @Query("SELECT * FROM members")
    fun getAllMembers(): List<Member>
}