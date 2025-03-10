package com.example.beer_mat.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch

@Database(entities = [FoodItem::class, DrinkItem::class, Member::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun foodDao(): FoodDao
    abstract fun drinkDao(): DrinkDao
    abstract fun memberDao(): MemberDao

    private class AppDatabaseCallback(
        private val scope: CoroutineScope
    ) : RoomDatabase.Callback() {
        override fun onCreate(db: SupportSQLiteDatabase) {
            super.onCreate(db)
            INSTANCE?.let { database ->
                scope.launch {
                    populateDatabase(database.foodDao(), database.drinkDao())
                }
            }
        }

        suspend fun populateDatabase(foodDao: FoodDao, drinkDao: DrinkDao) {
            // Insert default food items
            foodDao.insert(FoodItem(name = "Hot Dog", price = 2.00))
            foodDao.insert(FoodItem(name = "Bratwurst", price = 2.00))
            foodDao.insert(FoodItem(name = "Paar Bratwürste", price = 3.00))
            foodDao.insert(FoodItem(name = "Steak", price = 3.50))
            foodDao.insert(FoodItem(name = "Kuchen", price = 1.00))

            // Insert default drink items
            drinkDao.insert(DrinkItem(name = "Mineralwasser", price = 1.50))
            drinkDao.insert(DrinkItem(name = "Cola Mix", price = 2.00))
            drinkDao.insert(DrinkItem(name = "Iso Sport", price = 2.00))
            drinkDao.insert(DrinkItem(name = "Bio Apfel-Birnen-Schorle", price = 2.00))
            drinkDao.insert(DrinkItem(name = "Bier", price = 2.50))
            drinkDao.insert(DrinkItem(name = "Radler", price = 2.50))
            drinkDao.insert(DrinkItem(name = "Alkoholfreies Bier", price = 2.50))
            drinkDao.insert(DrinkItem(name = "Alkoholfreies Radler", price = 2.50))
            drinkDao.insert(DrinkItem(name = "Kaffee", price = 1.50))
        }
    }

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "beer_mat_database"
                )
                    .addCallback(AppDatabaseCallback(scope))
                    .build()
                INSTANCE = instance
                instance
            }
        }
    }
}