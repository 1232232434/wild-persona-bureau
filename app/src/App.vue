<template>
  <div class="app-shell">
    <div class="app-shell__glow app-shell__glow--left"></div>
    <div class="app-shell__glow app-shell__glow--right"></div>

    <header class="topbar">
      <RouterLink class="brand" to="/">
        <span class="brand__mark">野</span>
        <span>
          <strong>野性人格局</strong>
          <small>荒野人格实验档案</small>
        </span>
      </RouterLink>

      <nav class="topbar__nav">
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/test">答题页</RouterLink>
        <RouterLink to="/result?preview=1">结果预览</RouterLink>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <footer class="app-footnote">
      <span>基于规范、计划、任务三文档协同开发</span>
      <span>用于自我观察，不替代专业诊断</span>
    </footer>
  </div>
</template>
