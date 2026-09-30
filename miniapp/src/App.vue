<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { getSession } from './lib/auth';
import { setToken } from './lib/api';

onLaunch(() => {
  const session = getSession();
  if (session) setToken(session.token);
});
</script>

<style lang="scss">
@import './uni.scss';
</style>
