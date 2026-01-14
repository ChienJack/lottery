import { createRouter, createWebHashHistory } from 'vue-router';
import OperatorDashboard from '../views/OperatorDashboard.vue';
import AudienceDisplay from '../views/AudienceDisplay.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'operator', component: OperatorDashboard },
    { path: '/audience', name: 'audience', component: AudienceDisplay },
  ],
});

export default router;
