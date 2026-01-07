// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import TestCamera from '@/components/TestCamera.vue'; // page pour tester la caméra

const routes = [
  { path: '/camera', name: 'Camera', component: TestCamera },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;