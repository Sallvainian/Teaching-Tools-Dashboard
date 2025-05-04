<template>
  <nav class="flex items-center justify-between p-4 border-b">
    <!-- Logo/Title Section -->
    <div class="flex items-center">
      <h1 class="text-xl font-bold">📚 My Edu App</h1>
    </div>
    
    <!-- Navigation Links -->
    <div class="hidden md:flex items-center space-x-4">
      <NuxtLink 
        to="/" 
        class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
      >
        Home
      </NuxtLink>
      <NuxtLink 
        to="/dashboard" 
        class="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition"
      >
        Dashboard
      </NuxtLink>
      
      <!-- Tools Dropdown using HeadlessUI Menu -->
      <Menu as="div" class="relative inline-block text-left">
        <div>
          <MenuButton class="inline-flex justify-center w-full px-2 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500">
            Tools
            <ChevronDownIcon
              class="w-5 h-5 ml-1 -mr-1"
              aria-hidden="true"
            />
          </MenuButton>
        </div>
        
        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <MenuItems class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 dark:divide-gray-700 rounded-md bg-white dark:bg-dark-surface shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
            <div class="px-1 py-1">
              <MenuItem v-slot="{ active }">
                <NuxtLink
                  to="/lesson-planner"
                  :class="[
                    active ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300',
                    'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                  ]"
                >
                  <span class="mr-2">📝</span> Lesson Planner
                </NuxtLink>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <NuxtLink
                  to="/gradebook"
                  :class="[
                    active ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300',
                    'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                  ]"
                >
                  <span class="mr-2">📊</span> Gradebook
                </NuxtLink>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <NuxtLink
                  to="/class-dojo-remake"
                  :class="[
                    active ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300',
                    'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                  ]"
                >
                  <span class="mr-2">🏆</span> ClassDojo Remake
                </NuxtLink>
              </MenuItem>
            </div>
          </MenuItems>
        </transition>
      </Menu>
    </div>
    
    <!-- Mobile Menu Button -->
    <div class="md:hidden">
      <Menu as="div" class="relative inline-block text-left">
        <div>
          <MenuButton class="inline-flex justify-center p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md focus:outline-none">
            <Bars3Icon class="w-6 h-6" aria-hidden="true" />
          </MenuButton>
        </div>
        
        <transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <MenuItems class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 dark:divide-gray-700 rounded-md bg-white dark:bg-dark-surface shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
            <div class="px-1 py-1">
              <MenuItem v-slot="{ active }">
                <NuxtLink
                  to="/"
                  :class="[
                    active ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300',
                    'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                  ]"
                >
                  Home
                </NuxtLink>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <NuxtLink
                  to="/dashboard"
                  :class="[
                    active ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300',
                    'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                  ]"
                >
                  Dashboard
                </NuxtLink>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <NuxtLink
                  to="/lesson-planner"
                  :class="[
                    active ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300',
                    'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                  ]"
                >
                  <span class="mr-2">📝</span> Lesson Planner
                </NuxtLink>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <NuxtLink
                  to="/gradebook"
                  :class="[
                    active ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300',
                    'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                  ]"
                >
                  <span class="mr-2">📊</span> Gradebook
                </NuxtLink>
              </MenuItem>
              <MenuItem v-slot="{ active }">
                <NuxtLink
                  to="/class-dojo-remake"
                  :class="[
                    active ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300',
                    'group flex w-full items-center rounded-md px-2 py-2 text-sm'
                  ]"
                >
                  <span class="mr-2">🏆</span> ClassDojo Remake
                </NuxtLink>
              </MenuItem>
            </div>
          </MenuItems>
        </transition>
      </Menu>
    </div>
    
    <!-- Dark Mode Toggle -->
    <div class="flex items-center ml-4">
      <DarkModeToggle />
    </div>
  </nav>
</template>

<script setup lang="ts">
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import { computed } from 'vue'

// Icon components for navigation
const ChevronDownIcon = defineComponent({
  name: 'ChevronDownIcon',
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      fill: 'none',
      viewBox: '0 0 24 24',
      stroke: 'currentColor',
      class: this.$attrs.class
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M19 9l-7 7-7-7'
      })
    ])
  }
})

const Bars3Icon = defineComponent({
  name: 'Bars3Icon',
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      fill: 'none',
      viewBox: '0 0 24 24',
      stroke: 'currentColor',
      class: this.$attrs.class
    }, [
      h('path', {
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        'stroke-width': '2',
        d: 'M4 6h16M4 12h16M4 18h16'
      })
    ])
  }
})
</script>

