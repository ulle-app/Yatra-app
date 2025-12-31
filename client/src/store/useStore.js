import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const API_URL = '/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await axios.post(`${API_URL}/auth/login`, { email, password })
          const { token, user } = response.data
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          set({ user, token, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.error || 'Login failed'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await axios.post(`${API_URL}/auth/register`, { name, email, password })
          const { token, user } = response.data
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          set({ user, token, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.error || error.response?.data?.errors?.[0]?.msg || 'Registration failed'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      logout: () => {
        delete axios.defaults.headers.common['Authorization']
        set({ user: null, token: null, isAuthenticated: false })
      },

      checkAuth: async () => {
        const token = get().token
        if (!token) return

        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          const response = await axios.get(`${API_URL}/auth/me`)
          set({ user: response.data.user, isAuthenticated: true })
        } catch (error) {
          get().logout()
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)

export const useTempleStore = create((set, get) => ({
  temples: [],
  filteredTemples: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  searchQuery: '',
  crowdFilter: 'all',
  selectedTemple: null,

  fetchTemples: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await axios.get(`${API_URL}/temples`)
      set({
        temples: response.data,
        filteredTemples: response.data,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      })
      get().applyFilters()
    } catch (error) {
      set({ error: 'Failed to fetch temples', isLoading: false })
    }
  },

  fetchTempleDetails: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/temples/${id}`)
      set({ selectedTemple: response.data })
      return response.data
    } catch (error) {
      console.error('Failed to fetch temple details:', error)
      return null
    }
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query })
    get().applyFilters()
  },

  setCrowdFilter: (filter) => {
    set({ crowdFilter: filter })
    get().applyFilters()
  },

  applyFilters: () => {
    const { temples, searchQuery, crowdFilter } = get()
    let filtered = temples

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (temple) =>
          temple.name.toLowerCase().includes(query) ||
          temple.location.toLowerCase().includes(query) ||
          temple.state.toLowerCase().includes(query)
      )
    }

    if (crowdFilter !== 'all') {
      filtered = filtered.filter((temple) => temple.crowd?.crowdLevel === crowdFilter)
    }

    set({ filteredTemples: filtered })
  },

  refreshCrowdData: async () => {
    await get().fetchTemples()
  },
}))

export const usePlanStore = create(
  persist(
    (set, get) => ({
      plan: [],
      tripName: '',
      tripDate: '',

      addTemple: (temple) => {
        const plan = get().plan
        if (!plan.find((t) => t._id === temple._id)) {
          set({ plan: [...plan, temple] })
        }
      },

      removeTemple: (templeId) => {
        set({ plan: get().plan.filter((t) => t._id !== templeId) })
      },

      moveTemple: (fromIndex, toIndex) => {
        const plan = [...get().plan]
        const [removed] = plan.splice(fromIndex, 1)
        plan.splice(toIndex, 0, removed)
        set({ plan })
      },

      clearPlan: () => {
        set({ plan: [], tripName: '', tripDate: '' })
      },

      setTripName: (name) => set({ tripName: name }),
      setTripDate: (date) => set({ tripDate: date }),

      optimizeByCrowd: () => {
        const plan = [...get().plan]
        const order = { low: 0, medium: 1, high: 2 }
        plan.sort((a, b) => {
          const levelA = order[a.crowd?.crowdLevel] ?? 3
          const levelB = order[b.crowd?.crowdLevel] ?? 3
          if (levelA !== levelB) return levelA - levelB
          return (a.crowd?.crowdPercentage ?? 100) - (b.crowd?.crowdPercentage ?? 100)
        })
        set({ plan })
      },

      getCrowdSummary: () => {
        const plan = get().plan
        return {
          low: plan.filter((t) => t.crowd?.crowdLevel === 'low').length,
          medium: plan.filter((t) => t.crowd?.crowdLevel === 'medium').length,
          high: plan.filter((t) => t.crowd?.crowdLevel === 'high').length,
          total: plan.length,
        }
      },

      savePlan: async () => {
        const { plan, tripName, tripDate } = get()
        const token = useAuthStore.getState().token
        if (!token) return { success: false, error: 'Please login to save your plan' }

        try {
          await axios.post(`${API_URL}/plans`, {
            name: tripName || 'My Temple Trip',
            date: tripDate || new Date().toISOString(),
            templeIds: plan.map((t) => t._id),
          })
          return { success: true }
        } catch (error) {
          return { success: false, error: 'Failed to save plan' }
        }
      },
    }),
    {
      name: 'plan-storage',
    }
  )
)

export const useFestivalStore = create((set) => ({
  festivals: [],
  isLoading: false,

  fetchFestivals: async () => {
    set({ isLoading: true })
    try {
      const response = await axios.get(`${API_URL}/festivals`)
      set({ festivals: response.data, isLoading: false })
    } catch (error) {
      set({ isLoading: false })
    }
  },
}))
