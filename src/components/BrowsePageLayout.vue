<template>
  <div>
    <v-row no-gutters v-if="!noHeader" class="mb-1">
      <v-col cols="12">
        <v-card flat outlined>
          <img v-if="false" class="md-banner" :src="banner" />
          <v-card-text v-if="this.$slots.header">
            <slot name="header"></slot>
          </v-card-text>
        </v-card>
        <slot name="header2"></slot>
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col :cols="12">
        <v-progress-linear v-if="needSyncAccount" indeterminate></v-progress-linear>
        <slot v-else name="content"></slot>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapState } from "vuex";
import site from "@/server/site";

export default {
  name: "BrowsePageLayout",
  components: {
  },
  props: {
    noHeader: Boolean,
  },
  computed: {
    ...mapState({
      needSyncAccount: state => state.needSyncAccount
    })
  },
  data: () => ({
    banner: site.image
  })
};
</script>

<style lang="scss" scoped>
.md-banner {
  width: 100%;
}
</style>
