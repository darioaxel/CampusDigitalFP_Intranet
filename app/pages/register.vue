<script setup>
const email = ref("")
const password = ref("")
const role = ref("user")

const loading = ref(false)
const errorMsg = ref("")

// Si el usuario actual está logueado y es ROOT, puede crear usuarios con rol
const session = useUserSession()
const canSelectRole = computed(() => session.user?.role === "root")

async function submit() {
  errorMsg.value = ""
  loading.value = true

  try {
    await $fetch("/api/auth/register", {
      method: "POST",
      body: {
        email: email.value,
        password: password.value,
        role: canSelectRole.value ? role.value : undefined
      }
    })

    // Tras registro, el backend ya crea la sesión → redirigir
    return navigateTo("/")
  } 
  catch (err) {
    errorMsg.value = err?.data?.message ?? "Error al registrar"
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <h1>Registro</h1>

    <form @submit.prevent="submit" class="form">

      <div>
        <label>Email</label>
        <input v-model="email" type="email" required>
      </div>

      <div>
        <label>Password</label>
        <input v-model="password" type="password" required>
      </div>

      <!-- Mostrar selección de rol SOLO si el usuario actual es ROOT -->
      <div v-if="canSelectRole">
        <label>Rol</label>
        <select v-model="role">
          <option value="user">Usuario</option>
          <option value="admin">Admin</option>
          <option value="root">Root</option>
        </select>
      </div>

      <div v-if="errorMsg" class="error">
        {{ errorMsg }}
      </div>

      <button :disabled="loading">
        {{ loading ? "Creando cuenta..." : "Registrar" }}
      </button>

    </form>
  </div>
</template>

<style scoped>
.register-page {
  max-width: 400px;
  margin: auto;
  padding: 2rem;
}
.form div {
  margin-bottom: 1rem;
}
.error {
  color: red;
  margin-bottom: 1rem;
}
</style>
