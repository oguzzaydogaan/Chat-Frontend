<template>
  <Combobox v-model="selectedPeople" :multiple="props.isMultiple">
    <div class="relative">
      <div
        class="relative w-full cursor-default overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700 text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm"
      >
        <div v-if="props.isMultiple" class="flex overflow-y-auto items-center">
          <span
            v-for="person in selectedPeople"
            :key="person.id"
            @click="removeSelectedPerson(person.id)"
            class="m-1 rounded-md bg-teal-100 hover:bg-red-100 px-2 py-1 text-teal-900 hover:text-red-900 text-xs text-nowrap"
          >
            {{ person.name }}
          </span>
        </div>
        <div class="flex">
          <ComboboxInput
            class="flex-1 border-none bg-gray-200 dark:bg-gray-700 py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-gray-400 focus:ring-0"
            :displayValue="props.isMultiple ? () => '' : (person) => person?.name"
            @change="query = $event.target.value"
            :placeholder="props.isMultiple ? 'Choose users' : 'Choose a user'"
          />

          <ComboboxButton class="flex items-center pr-2">
            <ChevronUpDownIcon class="h-5 w-5 text-gray-400" aria-hidden="true" />
          </ComboboxButton>
        </div>
      </div>
      <TransitionRoot
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        @after-leave="query = ''"
      >
        <ComboboxOptions
          class="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-md bg-gray-200 dark:bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm"
        >
          <div
            v-if="filteredPeople.length === 0"
            class="relative cursor-default select-none px-4 py-2 text-gray-700 dark:text-white"
          >
            Nothing found.
          </div>

          <ComboboxOption
            v-for="person in filteredPeople"
            as="template"
            :key="person.id"
            :value="person"
            v-slot="{ selected, active }"
          >
            <li
              class="relative cursor-default select-none py-2 pl-10 pr-4"
              :class="{
                'bg-teal-600 text-white': active,
                'text-gray-900 dark:text-white': !active,
              }"
            >
              <span
                class="block truncate"
                :class="{ 'font-medium': selected, 'font-normal': !selected }"
              >
                {{ person.name }}
              </span>
              <span
                v-if="selected"
                class="absolute inset-y-0 left-0 flex items-center pl-3"
                :class="{ 'text-white': active, 'text-teal-600': !active }"
              >
                <CheckIcon class="h-5 w-5" aria-hidden="true" />
              </span>
            </li>
          </ComboboxOption>
        </ComboboxOptions>
      </TransitionRoot>
    </div>
  </Combobox>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot,
} from '@headlessui/vue'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/20/solid'

const props = defineProps(['data', 'isMultiple', 'modelValue'])
const emit = defineEmits(['update:modelValue'])

const people = ref(props.data)
watch(
  () => props.data,
  (newData) => {
    people.value = newData
  },
)

const selectedPeople = props.isMultiple ? ref([]) : ref()
async function removeSelectedPerson(id) {
  selectedPeople.value = selectedPeople.value.filter((p) => p.id !== id)
  emit('update:modelValue', selectedPeople.value)
}

const query = ref('')

let filteredPeople = computed(() =>
  query.value === ''
    ? people.value
    : people.value.filter((person) =>
        person.name
          .toLowerCase()
          .replace(/\s+/g, '')
          .includes(query.value.toLowerCase().replace(/\s+/g, '')),
      ),
)
</script>
