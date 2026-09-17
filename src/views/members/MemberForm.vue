<script setup lang="ts">
import { Save } from 'lucide-vue-next';

import type { CreateMemberData } from '@/types/member.type';

/**
 * Formulario de la ficha del socio, el mismo para el alta y la edición del
 * administrador. Los largos máximos son los que valida el backend.
 */
const form = defineModel<CreateMemberData>({ required: true });

const props = defineProps<{
  mode: 'create' | 'edit';
  loading: boolean;
  // Deshabilita el guardado (por ejemplo, sin cambios o ya creado).
  disabled?: boolean;
}>();

const emit = defineEmits<{
  submit: [];
  cancel: [];
}>();

const inputClass =
  'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100';

const labelClass = 'mb-2 block text-sm font-medium text-slate-700';

const fieldsetClass =
  'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm';

const legendClass =
  'px-1 text-xs font-semibold uppercase tracking-wide text-slate-400';

// El atributo `pattern` se compila con el flag `v`: dentro de la clase los
// paréntesis y el guion van escapados o el navegador ignora el patrón.
const PHONE_PATTERN = '\\+?[\\d\\s\\(\\)\\-]{6,20}';
const PHONE_TITLE = 'Solo números, espacios, +, - y paréntesis (6 a 20)';

const id = (field: string) => `socio-${props.mode}-${field}`;
</script>

<template>
  <form class="space-y-5" @submit.prevent="emit('submit')">
    <!-- Datos de la empresa -->
    <fieldset :class="fieldsetClass">
      <legend :class="legendClass">Datos de la empresa</legend>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label :for="id('razon-social')" :class="labelClass">
            Razón social
          </label>

          <input
            :id="id('razon-social')"
            v-model="form.razonSocial"
            required
            maxlength="150"
            type="text"
            :class="inputClass"
          />
        </div>

        <div>
          <label :for="id('titular')" :class="labelClass">
            Nombre del titular
          </label>

          <input
            :id="id('titular')"
            v-model="form.titular"
            required
            maxlength="150"
            type="text"
            :class="inputClass"
          />
        </div>

        <div>
          <label :for="id('giro')" :class="labelClass">Giro comercial</label>

          <input
            :id="id('giro')"
            v-model="form.giroComercial"
            required
            maxlength="100"
            type="text"
            placeholder="Ej. Supermercado, ferretería, servicios..."
            :class="inputClass"
          />
        </div>

        <div>
          <label :for="id('inicio')" :class="labelClass">
            Fecha de inicio de la empresa
          </label>

          <input
            :id="id('inicio')"
            v-model="form.fechaInicioEmpresa"
            required
            type="date"
            :class="inputClass"
          />
        </div>

        <div>
          <label :for="id('rut')" :class="labelClass">RUT</label>

          <input
            :id="id('rut')"
            v-model="form.rut"
            required
            maxlength="50"
            type="text"
            :class="inputClass"
          />
        </div>

        <div>
          <label :for="id('bps')" :class="labelClass">Nº BPS</label>

          <input
            :id="id('bps')"
            v-model.trim="form.numeroBps"
            required
            type="text"
            inputmode="numeric"
            pattern="\d{7,12}"
            maxlength="12"
            title="El número de BPS debe tener entre 7 y 12 números"
            :class="inputClass"
          />

          <p class="mt-1 text-xs text-slate-400">De 7 a 12 números.</p>
        </div>
      </div>
    </fieldset>

    <!-- Contacto -->
    <fieldset :class="fieldsetClass">
      <legend :class="legendClass">Contacto</legend>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label :for="id('telefono')" :class="labelClass">Teléfono</label>

          <input
            :id="id('telefono')"
            v-model="form.telefono"
            required
            type="tel"
            maxlength="20"
            :pattern="PHONE_PATTERN"
            :title="PHONE_TITLE"
            :class="inputClass"
          />
        </div>

        <div>
          <label :for="id('celular')" :class="labelClass">Celular</label>

          <input
            :id="id('celular')"
            v-model="form.celular"
            required
            type="tel"
            maxlength="20"
            :pattern="PHONE_PATTERN"
            :title="PHONE_TITLE"
            :class="inputClass"
          />
        </div>

        <div>
          <label :for="id('direccion')" :class="labelClass">Dirección</label>

          <input
            :id="id('direccion')"
            v-model="form.direccion"
            required
            maxlength="150"
            type="text"
            :class="inputClass"
          />
        </div>

        <div>
          <label :for="id('ciudad')" :class="labelClass">
            Ciudad / Localidad
          </label>

          <input
            :id="id('ciudad')"
            v-model="form.ciudad"
            required
            maxlength="80"
            type="text"
            :class="inputClass"
          />
        </div>

        <div class="md:col-span-2">
          <label :for="id('email')" :class="labelClass">Email</label>

          <input
            :id="id('email')"
            v-model.trim="form.email"
            required
            maxlength="255"
            type="email"
            autocapitalize="none"
            :class="inputClass"
          />

          <p class="mt-1 text-xs text-slate-400">
            <template v-if="mode === 'create'">
              Este email será utilizado también para crear la cuenta del socio.
            </template>
            <template v-else>
              Es también el email con el que el socio inicia sesión: si lo
              cambiás, tiene que entrar con el nuevo.
            </template>
          </p>
        </div>
      </div>
    </fieldset>

    <!-- Afiliación -->
    <fieldset :class="fieldsetClass">
      <legend :class="legendClass">Afiliación</legend>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label :for="id('tipo')" :class="labelClass">Tipo de socio</label>

          <select
            :id="id('tipo')"
            v-model="form.tipo"
            required
            :class="inputClass"
          >
            <option value="COMUN">Común</option>
            <option value="DIRECTIVO">Directivo</option>
          </select>

          <p class="mt-1 text-xs text-slate-400">
            Los directivos ven el directorio de socios.
          </p>
        </div>

        <div>
          <label :for="id('afiliacion')" :class="labelClass">
            Fecha de afiliación
          </label>

          <input
            :id="id('afiliacion')"
            v-model="form.fechaAfiliacion"
            required
            type="date"
            :class="inputClass"
          />
        </div>

        <div class="md:col-span-2">
          <label :for="id('observaciones')" :class="labelClass">
            Observaciones
          </label>

          <textarea
            :id="id('observaciones')"
            v-model="form.observaciones"
            rows="4"
            maxlength="2000"
            :class="[inputClass, 'resize-none']"
          />

          <p class="mt-1 text-xs text-slate-400">
            Notas internas: el socio no las ve.
          </p>
        </div>
      </div>
    </fieldset>

    <div class="flex justify-end gap-3">
      <button
        type="button"
        class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        :disabled="loading"
        @click="emit('cancel')"
      >
        Cancelar
      </button>

      <button
        type="submit"
        :disabled="loading || disabled"
        class="flex items-center gap-2 rounded-xl bg-ccisj px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save class="h-4 w-4" />

        <template v-if="loading">Guardando...</template>
        <template v-else-if="mode === 'create'">Crear socio</template>
        <template v-else>Guardar cambios</template>
      </button>
    </div>
  </form>
</template>
