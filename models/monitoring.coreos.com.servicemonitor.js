export default {
  _detailLocation() {
    const id = this.id?.replace(/.*\//, '');

    return {
      name:   'c-cluster-monitoring-monitor-namespace-id',
      params: {
        cluster: this.$rootGetters['clusterId'], id, namespace: this.metadata.namespace
      },
      query: { resource: this.type }
    };
  },

  doneOverride() {
    return {
      name:   'c-cluster-monitoring-monitor',
      params: { cluster: this.$rootGetters['clusterId'] },
      query:  { resource: this.type }
    };
  },
};