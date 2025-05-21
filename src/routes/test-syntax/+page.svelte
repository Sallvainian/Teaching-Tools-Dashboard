<script lang="ts">
  let count = 0;
  function handleClick() {
    count += 1;
  }
</script>

<button onclick={handleClick}>
  Count: {count}
</button>