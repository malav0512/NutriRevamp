document.addEventListener("DOMContentLoaded", () => {
  // Fetch categories and populate the category dropdown
  fetchCategories();
  initializeWeightInput();
});

let foodItems = []; // Array to store multiple food items

function fetchCategories() {
  fetch("http://localhost:3000/categories")
    .then((response) => response.json())
    .then((data) => {
      const categorySelect = document.getElementById("food-category");
      data.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.category;
        option.textContent = category.category;
        categorySelect.appendChild(option);
      });
    })
    .catch((error) => {
      console.error("Error fetching categories:", error);
    });
}

  // Event listener for category selection
  document.getElementById("food-category").addEventListener("input", (event) => {
    const query = event.target.value.trim();
  if (query.length > 0) {
    fetch(`http://localhost:3000/categories?search=${encodeURIComponent(query)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        return response.json();
      })
      .then((data) => {
        const suggestionsDiv = document.getElementById("category-suggestions");
        suggestionsDiv.innerHTML = ""; // Clear previous suggestions

         if (data.length === 0) {
          suggestionsDiv.innerHTML = "<div class='suggestion-item'>No categories found</div>";
        }

        data.forEach((item) => {
          const suggestion = document.createElement("div");
          suggestion.className = "suggestion-item";
          suggestion.textContent = item.category;
          suggestion.addEventListener("click", () => {
            document.getElementById("food-category").value = item.category;
            suggestionsDiv.innerHTML = ""; // Clear suggestions
            fetchDescriptions(item.category); // Fetch descriptions for the selected category
          });
          suggestionsDiv.appendChild(suggestion);
        });
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  } else {
    document.getElementById("category-suggestions").innerHTML = ""; // Clear suggestions if input is empty
  }
});

  function fetchDescriptions(category) {
  fetch(`http://localhost:3000/descriptions?category=${category}`)
    .then((response) => response.json())
    .then((data) => {
      const descriptionSelect = document.getElementById("food-description");
      descriptionSelect.innerHTML = "<option value=''>Select a description</option>"; // Clear existing options

      data.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.description;
        option.textContent = item.description;
        descriptionSelect.appendChild(option);
      });
    })
    .catch((error) => {
      console.error("Error fetching descriptions:", error);
    });
}

  // Event listener for fetching nutritional info
  document.getElementById("fetch-nutrition").addEventListener("click", () => {
    const category = document.getElementById("food-category").value;
    const description = document.getElementById("food-description").value;
    const quantity = parseFloat(document.getElementById("food-quantity").value);
    // Validate inputs
    if (!category || !description || isNaN(quantity) || quantity <= 0) {
    alert("Please select a category, description, and enter a valid quantity.");
    return;
  }
  // Fetch data from the API
  fetch(`http://localhost:3000/food?category=${category}&description=${encodeURIComponent(description)}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch data. Please check your inputs or try again later.");
      }
      return response.json();
    })
    .then((data) => {
      // Display the nutritional details
      if (data && data.length > 0) {
        const food = data[0];
         // Calculate values based on quantity
         const protein = (food["Data.Protein"] * quantity) / 100;
        const carbs = (food["Data.Carbohydrate"] * quantity) / 100;
        const fats = (food["Data.Fat.Total Lipid"] * quantity) / 100;
        const calories = (food["Data.Kilocalories"] * quantity) / 100;

         // Add the food item to the array
        foodItems.push({
          name: food["Description"] || "N/A",
          quantity,
          protein,
          carbs,
          fats,
          calories,
        });

        // Update UI with the new food item
        updateNutritionDisplay();
      } else {
        alert("No data found for the given inputs.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      alert(error.message);
    });
});

// Function to update the nutritional display
function updateNutritionDisplay() {
  const nutritionInfoDiv = document.getElementById("nutrition-info");
  const totalNutritionDiv = document.getElementById("total-nutrition");

  // Clear the current display
  nutritionInfoDiv.innerHTML = "<h3>Individual Nutritional Details:</h3>";
  totalNutritionDiv.innerHTML = "<h3>Total Nutritional Info:</h3>";

  // Display individual food items
  foodItems.forEach((item, index) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "food-item";
    itemDiv.innerHTML += `
      <p><strong>Food ${index + 1}:</strong> ${item.name} (${item.quantity}g)</p>
      <p>Protein: ${item.protein.toFixed(2)}g</p>
      <p>Carbs: ${item.carbs.toFixed(2)}g</p>
      <p>Fats: ${item.fats.toFixed(2)}g</p>
      <p>Calories: ${item.calories.toFixed(2)} kcal</p>
      <button class="remove-button" onclick="removeItem(${index})">Remove</button>
      <hr>
    `;
    nutritionInfoDiv.appendChild(itemDiv);
  });

  // Calculate total nutritional values
  const total = foodItems.reduce(
    (sum, item) => {
      sum.protein += item.protein;
      sum.carbs += item.carbs;
      sum.fats += item.fats;
      sum.calories += item.calories;
      return sum;
    },
    { protein: 0, carbs: 0, fats: 0, calories: 0 }
  );

  // Display total nutritional values
  totalNutritionDiv.innerHTML += `
    <p><strong>Total Protein:</strong> ${total.protein.toFixed(2)}g</p>
    <p><strong>Total Carbs:</strong> ${total.carbs.toFixed(2)}g</p>
    <p><strong>Total Fats:</strong> ${total.fats.toFixed(2)}g</p>
    <p><strong>Total Calories:</strong> ${total.calories.toFixed(2)} kcal</p>
  `;
}
// Function to remove an item from the list
function removeItem(index) {
  // Remove the item from the foodItems array
  foodItems.splice(index, 1);

  // Update the nutritional display
  updateNutritionDisplay();
}
// Initialize weight input functionality
function initializeWeightInput() {
  const weightInput = document.getElementById("weight-input");
  const weightUnit = document.getElementById("weight-unit");
  const weightOutput = document.getElementById("weight-output");

  // Update the output dynamically as the user types or changes the unit
  weightInput.addEventListener("input", updateWeightOutput);
  weightUnit.addEventListener("change", handleUnitChange);

  function updateWeightOutput(weightInput, weightUnit) {
    const weightValue = weightInput.value;
    const unit = weightUnit.value;

     if (!isNaN(weightValue)) {
    weightInput.value = unit === "kg" ? weightValue : (weightValue * 2.20462).toFixed(2);
  }
  }

  function handleUnitChange() {
    const weightValue = parseFloat(weightInput.value);
    const currentUnit = weightUnit.value;

    if (!isNaN(weightValue)) {
      let convertedValue;
      if (currentUnit === "kg") {
        // Convert kg to lbs
        convertedValue = (weightValue * 2.20462).toFixed(2);
        weightInput.value = convertedValue;  // Update the input box value
        weightOutput.textContent = ``;
      } else if (currentUnit === "lbs") {
        // Convert lbs to kg
        convertedValue = (weightValue / 2.20462).toFixed(2);
        weightInput.value = convertedValue;  // Update the input box value
        weightOutput.textContent = ``;
      }
    } else {
      weightOutput.textContent = "";
    }
  }
}

// Call the function to initialize the weight input functionality
initializeWeightInput();

function showContent(type) {
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => section.classList.add('hidden'));

            const selectedSection = document.getElementById(`${type}-content`);
            selectedSection.classList.remove('hidden');
        }
    document.getElementById('feedbackForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent the default form submission

    const feedback = event.target.feedback.value;

    try {
      // Send feedback to the server
      const response = await fetch('http://127.0.0.1:3000/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedback }),
      });

      if (response.ok) {
        alert('Your feedback submitted successfully!');
        window.location.href = 'http://127.0.0.1:5500'; // Redirect to the home page
      } else {
        alert('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  });
  document.getElementById("nutritionForm").addEventListener("submit", function(event) {
    event.preventDefault();  // Prevent form from submitting

    // Get user inputs
    const weight = parseFloat(document.getElementById("weight").value);
    const dailyCalories = parseFloat(document.getElementById("calories").value);

    // Calculate nutritional values
    const protein = 0.8 * weight;  // Protein = 0.8 * weight (kg)
    const fats = 0.25 * dailyCalories;  // Fats = 0.25 * total daily calories
    const carbohydrates = 0.7 * weight;  // Carbs = 0.7 * weight (kg)

    // Display results
    document.getElementById("result").innerHTML = `
        <h2>Your Nutritional Intake:</h2>
        <p><strong>Protein:</strong> ${protein.toFixed(2)} g</p>
        <p><strong>Fats:</strong> ${fats.toFixed(2)} g</p>
        <p><strong>Carbohydrates:</strong> ${carbohydrates.toFixed(2)} g</p>
    `;
});