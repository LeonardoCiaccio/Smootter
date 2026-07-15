<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from 'vue'
import { CheckIcon, ChevronDownIcon, PlusIcon } from '@heroicons/vue/24/outline'
import { ui } from '@/styles/ui'
import { normalizeCategoryName, type CategoryLike } from '@/shared/categoryTree'

// Domain-agnostic (bookmarklets, replacer, ...): the caller owns persistence and copy, this
// component only owns the picker/create-new UI.
const props = defineProps<{
  categories: CategoryLike[]
  saveCategory: (category: CategoryLike) => Promise<void>
  categoryLabel: string
  newCategoryTitle: string
  newCategoryPlaceholder: string
}>()
const categoryId = defineModel<string>('categoryId', { required: true })
const emit = defineEmits<{ created: [category: CategoryLike] }>()

const addingNew = ref(false)
const newCategoryName = ref('')
const newCategoryInput = ref<HTMLInputElement>()
const open = ref(false)
const anchorRef = ref<HTMLElement>()

const selectedCategory = computed(() => props.categories.find((category) => category.id === categoryId.value))

function onDocumentClick(event: MouseEvent): void {
  if (!anchorRef.value?.contains(event.target as Node)) closeMenu()
}

function openMenu(): void {
  open.value = true
  document.addEventListener('mousedown', onDocumentClick)
}

function closeMenu(): void {
  open.value = false
  document.removeEventListener('mousedown', onDocumentClick)
}

function toggleMenu(): void {
  if (open.value) closeMenu()
  else openMenu()
}

function selectCategory(id: string): void {
  categoryId.value = id
  closeMenu()
}

onUnmounted(() => document.removeEventListener('mousedown', onDocumentClick))

async function onStartNewCategory(): Promise<void> {
  closeMenu()
  addingNew.value = true
  await nextTick()
  newCategoryInput.value?.focus()
}

async function onCreateCategory(): Promise<void> {
  const name = normalizeCategoryName(newCategoryName.value)
  if (name === '') return

  // Same path, sloppy spacing (e.g. "AA / BB" vs "AA/BB") must never become two records 
  // reuse the existing one instead of creating a duplicate with the same visible name.
  const existing = props.categories.find((category) => category.name === name)
  if (existing) {
    categoryId.value = existing.id
    newCategoryName.value = ''
    addingNew.value = false
    return
  }

  const category: CategoryLike = { id: crypto.randomUUID(), name }
  await props.saveCategory(category)
  emit('created', category)
  categoryId.value = category.id
  newCategoryName.value = ''
  addingNew.value = false
}
</script>

<template>
  <div :class="ui.categoryCombobox">
    <span :class="ui.wizardFieldLabel">{{ categoryLabel }}</span>

    <div v-if="!addingNew" :class="ui.categoryComboboxRow">
      <div ref="anchorRef" :class="ui.categoryComboboxAnchor">
        <button type="button" :class="ui.categoryComboboxTrigger" @click="toggleMenu">
          <span :class="ui.categoryComboboxTriggerText">{{ selectedCategory?.name }}</span>
          <ChevronDownIcon :class="ui.categoryComboboxChevron" />
        </button>

        <div v-if="open" :class="ui.categoryComboboxMenu">
          <button
            v-for="category in props.categories"
            :key="category.id"
            type="button"
            :class="[ui.categoryComboboxOption, category.id === categoryId && ui.categoryComboboxOptionActive]"
            @click="selectCategory(category.id)"
          >
            {{ category.name }}
          </button>
        </div>
      </div>

      <button type="button" :class="ui.categoryAddButton" :title="newCategoryTitle" @click="onStartNewCategory">
        <PlusIcon class="h-4 w-4" />
      </button>
    </div>

    <div v-else :class="ui.categoryComboboxRow">
      <input
        ref="newCategoryInput"
        v-model="newCategoryName"
        type="text"
        :class="ui.input"
        :placeholder="newCategoryPlaceholder"
        @keydown.enter.prevent="onCreateCategory"
        @keydown.escape="addingNew = false"
      />
      <button type="button" :class="ui.categoryAddButton" :title="newCategoryTitle" @click="onCreateCategory">
        <CheckIcon class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
