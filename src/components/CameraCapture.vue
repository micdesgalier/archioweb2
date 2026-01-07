<script setup>
/*
  CameraCapture.vue
  - Vue 3 Composition API
  - Préférence caméra arrière (facingMode: 'environment') sur mobile
  - Fallback file input (capture attribute) pour vieux navigateurs/iOS webviews
*/

import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const videoRef = ref(null);
const canvasRef = ref(null);
const streamRef = ref(null);
const isStreaming = ref(false);
const isSupported = typeof navigator !== 'undefined' &&
                    navigator.mediaDevices &&
                    typeof navigator.mediaDevices.getUserMedia === 'function';
const errorMsg = ref('');
const capturedBlob = ref(null);
const uploading = ref(false);
const facing = ref('environment'); // 'environment' (back) or 'user' (front)

// Computed property pour l'URL de prévisualisation
const previewUrl = computed(() => {
  if (!capturedBlob.value) return null;
  return URL.createObjectURL(capturedBlob.value);
});

function isProbablyMobile() {
  return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

async function startCamera() {
  if (!isSupported) {
    errorMsg.value = "La capture vidéo n'est pas prise en charge par ce navigateur.";
    return;
  }

  try {
    errorMsg.value = '';
    // constraints: prefer back camera on mobile
    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: facing.value },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    streamRef.value = stream;
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      // some browsers require play() call
      await videoRef.value.play();
    }
    isStreaming.value = true;
  } catch (err) {
    console.error('getUserMedia error:', err);
    errorMsg.value = "Impossible d'accéder à la caméra — autorisation refusée ou capteur indisponible.";
    isStreaming.value = false;
  }
}

function stopCamera() {
  if (streamRef.value) {
    streamRef.value.getTracks().forEach(t => t.stop());
    streamRef.value = null;
  }
  isStreaming.value = false;
}

function toggleFacing() {
  // change le facing et redémarre
  facing.value = facing.value === 'environment' ? 'user' : 'environment';
  stopCamera();
  startCamera();
}

function capture() {
  if (!isStreaming.value || !videoRef.value) return;

  const v = videoRef.value;
  const c = canvasRef.value;
  // set canvas size to video size
  c.width = v.videoWidth || 1280;
  c.height = v.videoHeight || 720;

  const ctx = c.getContext('2d');
  ctx.drawImage(v, 0, 0, c.width, c.height);

  // convert to blob (jpeg 0.9 quality)
  return new Promise((resolve) => {
    c.toBlob((blob) => {
      capturedBlob.value = blob;
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

async function uploadCaptured(url = '/api/upload-photo') {
  if (!capturedBlob.value) return;
  uploading.value = true;
  try {
    const form = new FormData();
    form.append('photo', capturedBlob.value, 'capture.jpg');

    const res = await fetch(url, {
      method: 'POST',
      body: form,
    });

    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const json = await res.json();
    uploading.value = false;
    return json;
  } catch (err) {
    console.error(err);
    uploading.value = false;
    throw err;
  }
}

function onFileInputChange(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  console.log('File selected:', file.name, file.type, file.size);
  capturedBlob.value = file;
  e.target.value = ''; // permet de resélectionner la même image
}

onMounted(() => {
  // Optionnel : démarre automatiquement sur mobile
  if (isProbablyMobile() && isSupported) {
    // start automatically so user doesn't have to press (but browsers often require gesture)
    // best is to let the user trigger; we keep auto attempt but fallback is fine.
    // startCamera();
  }
});

onBeforeUnmount(() => {
  stopCamera();
  // Nettoyage des URL objets
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<template>
  <div class="p-4 max-w-xl mx-auto">
    <h3 class="text-lg font-semibold mb-3">Prendre une photo</h3>

    <!-- Fallback: input file (works on all mobiles; capture requests opening camera) -->
    <div class="mt-4">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        @change="onFileInputChange"
        class="block"
      />
    </div>

    <!-- Preview + Upload -->
    <div v-if="capturedBlob" class="mt-4">
      <h4 class="font-medium">Aperçu</h4>
      <img
        v-if="previewUrl"
        :src="previewUrl"
        alt="preview"
        class="w-full max-h-96 object-contain rounded shadow mt-2"
      />
      <div class="flex gap-2 mt-2">
        <button @click="uploadCaptured()" :disabled="uploading" class="px-3 py-2 rounded bg-indigo-600 text-white">
          {{ uploading ? 'Envoi...' : 'Envoyer la photo' }}
        </button>
        <button @click="capturedBlob = null" class="px-3 py-2 rounded bg-gray-200">Reprendre</button>
      </div>
    </div>

    <div v-else class="text-sm text-gray-500 mt-3">Aucune photo capturée</div>

    <!-- Canvas caché pour la capture vidéo -->
    <canvas ref="canvasRef" class="hidden"></canvas>
  </div>
</template>

<style scoped>
/* minimal styling; utilise Tailwind si disponible */
</style>