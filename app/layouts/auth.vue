<template>
  <div class="min-h-screen bg-warmGray-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <!-- Logo -->
      <div class="flex items-center justify-center gap-2 mb-8">
        <UIcon name="i-lucide-paw-print" class="w-8 h-8 text-forest-700" />
        <span class="text-2xl font-bold text-forest-700 tracking-tight">DogWalk</span>
      </div>

      <!-- Content -->
      <slot />
    </div>
  </div>
</template>
