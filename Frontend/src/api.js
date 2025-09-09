// Backend base URL - change this to match your backend server
const BASE_URL = "http://127.0.0.1:8000"

/**
 * Fetch encoder options from the backend
 * Returns object with Climate, BudgetLevel, and Accessibility arrays
 */
export const fetchEncoders = async () => {
  try {
    const response = await fetch(`${BASE_URL}/encoders`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Failed to fetch encoders:", error)
    throw error
  }
}

/**
 * Send recommendation request to backend
 * @param {Object} payload - Search criteria matching backend schema
 * @param {number} top_k - Number of results to return (default: 10)
 * @returns {Array} Array of recommended destinations
 */
export const recommend = async (payload, top_k = 10) => {
  try {
    const response = await fetch(`${BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...payload, top_k }),
    })

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.message || errorMessage
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()

    // Handle case where backend returns empty results
    if (!Array.isArray(data)) {
      throw new Error("Invalid response format from server")
    }

    return data
  } catch (error) {
    console.error("Failed to get recommendations:", error)
    throw error
  }
}

/**
 * Fetch states for a given country (fallback function)
 * @param {string} country - Country name
 * @returns {Array} Array of state names
 */
export const fetchStates = async (country) => {
  try {
    const response = await fetch(`${BASE_URL}/states?country=${encodeURIComponent(country)}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Failed to fetch states:", error)
    throw error
  }
}
