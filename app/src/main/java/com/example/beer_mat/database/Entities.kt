package com.example.beer_mat.database

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query

@Dao
interface FoodDao {
    @Insert
    suspend fun insert(foodItem: FoodItem)

    @Query("SELECT * FROM food")
    suspend fun getAllFoodItems(): List<FoodItem>
}

@Dao
interface DrinkDao {
    @Insert
    suspend fun insert(drinkItem: DrinkItem)

    @Query("SELECT * FROM drinks")
    suspend fun getAllDrinkItems(): List<DrinkItem>
}

@Dao
interface MemberDao {
    @Insert
    suspend fun insert(member: Member)

    @Query("SELECT * FROM members")
    suspend fun getAllMembers(): List<Member>
}