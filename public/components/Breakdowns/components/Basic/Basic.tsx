import './style.scss';

import React, { Component } from 'react';
import {
  EuiBasicTable
} from '@elastic/eui';
import Bubble from '../../../Bubble';
import { BasicBreakdown } from '../../../../utils/requests';
import { formatShort } from '../../../../utils/format';
import { Range } from '../../../../utils/time';

export const NO_ITEMS_WORKLOAD_INSIGHTS_CONFIGURED="No items found. Make sure you have Opni's Workload Insights configured to watch deployments in order to information here."

export function createColumns(type, range, showAnomaly, keywords) {
  const getQuery = (row, severity: string) => {
    const from = range.start.format();
    const to = range.end.format();
    const value = row.name;
    const query = keywords.length > 0 && severity === 'null'
      ? `query:(language:kuery,query:'${keywords.map(k => `log: "${k}"`).join(' or ')}')`
      : `query:(language:kuery,query:'')`;
    const severityQuery = severity !== 'null'
      ? `,('$state':(store:appState),meta:(alias:!n,disabled:!f,key:anomaly_level,negate:!f,params:(query:${severity}),type:phrase),query:(match_phrase:(anomaly_level:${severity})))`
      : ``

    const clusterQuery = row.clusterId !== 'all' ? `,('$state':(store:appState),meta:(alias:!n,disabled:!f,key:cluster_id,negate:!f,params:(query:'${row.clusterId}'),type:phrase),query:(match_phrase:(cluster_id:'${row.clusterId}')))` : '';
    switch (type) {
      case 'pod':
        return `_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:'${from}',to:'${to}'))&_a=(columns:!(_source),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,key:pod_name,negate:!f,params:(query:${value}),type:phrase),query:(match_phrase:(pod_name:${value})))${clusterQuery}${severityQuery}),interval:auto,${query},sort:!())`;
      case 'controlPlane':
        return `_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:'${from}',to:'${to}'))&_a=(columns:!(_source),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,key:log_type,negate:!f,params:(query:controlplane),type:phrase),query:(match_phrase:(log_type:controlplane)))${clusterQuery},('$state':(store:appState),meta:(alias:!n,disabled:!f,key:kubernetes_component,negate:!f,params:(query:${value}),type:phrase),query:(match_phrase:(kubernetes_component:${value})))${severityQuery}),interval:auto,${query},sort:!())`;
      case 'namespace':
        return `_g=(filters:(),refreshInterval:(pause:!t,value:0),time:(from:'${from}',to:'${to}'))&_a=(columns:!(_source),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,key:namespace_name,negate:!f,params:(query:${value}),type:phrase),query:(match_phrase:(namespace_name:${value})))${clusterQuery}${severityQuery}),interval:auto,${query},sort:!())`;
      case 'rancher':
        return `_g=(filters:(),refreshInterval:(pause:!t,value:0),time:(from:'${from}',to:'${to}'))&_a=(columns:!(_source),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,key:log_type,negate:!f,params:(query:rancher),type:phrase),query:(match_phrase:(log_type:rancher))),('$state':(store:appState),meta:(alias:!n,disabled:!f,key:pod_name,negate:!f,params:(query:${value}),type:phrase),query:(match_phrase:(pod_name:${value})))${clusterQuery}${severityQuery}),interval:auto,${query},sort:!())`;
      case 'longhorn':
        return `_g=(filters:(),refreshInterval:(pause:!t,value:0),time:(from:'${from}',to:'${to}'))&_a=(columns:!(_source),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,key:log_type,negate:!f,params:(query:longhorn),type:phrase),query:(match_phrase:(log_type:longhorn))),('$state':(store:appState),meta:(alias:!n,disabled:!f,key:pod_name,negate:!f,params:(query:${value}),type:phrase),query:(match_phrase:(pod_name:${value})))${clusterQuery}${severityQuery}),interval:auto,${query},sort:!())`;
      default:
        return '';
      }
  };

  const getUrl = (row, severity: string) => {
    const appPrefix = (location as any)?.pathname.match(/.*\/app\//)[0];
    const query = getQuery(row, severity);
    return `${appPrefix}discover#/?${query}`;
  };

  const getPercentage = (count, row) => {
    const total = row.anomaly + row.normal;

    return <span className="percent">
      - ({`${((count * 100 / total) || 0).toFixed(1)}%`})
    </span>;
  };

  const anomaly = showAnomaly 
    ? [{
      field: 'anomaly',
      name: 'Anomaly',
      render: (count, row) => <a href={getUrl(row, 'Anomaly')} target="_blank"><Bubble severity="anomaly">{formatShort(count)}</Bubble> {getPercentage(count, row)}</a>
    }] 
    : [];

  const keywordsColumn = keywords.length > 0 
    ? [{
      field: 'keywords',
      name: 'Keywords',
      render: (count, row) => {
        return <div className="keywords"><div><a href={getUrl(row, 'null')} target="_blank"><Bubble severity="suspicious">{formatShort(count)}</Bubble> {getPercentage(count, row)}</a></div></div>;
      }
    }]
    : [];

  return [
    {
      field: 'name',
      name: 'Name',
    },
    ...anomaly,
    ...keywordsColumn,
    {
      field: 'normal',
      name: 'Normal',
      render: (count, row) => {
        return <div className="normal"><div><a href={getUrl(row, 'Normal')} target="_blank"><Bubble severity="normal">{formatShort(count)}</Bubble> {getPercentage(count, row)}</a></div></div>;
      }
    }
  ];
}

function getRowProps(item: Group) {
  return item.group ? { className: 'group' } : {};
}

export type Group = { group?: true, name: string };
export type Item = BasicBreakdown | Group;

export interface BreakdownProps {
  type: string;
  breakdown: Item[];
  range: Range;
  clusterId: string;
  showAnomaly: boolean;
  keywords: string[];
  noItemsMessage?: string;
}

export default class Breakdown extends Component<BreakdownProps> {
  render() {
    const columns = createColumns(this.props.type, this.props.range, this.props.showAnomaly, this.props.keywords);

    return (
        <div className="basic-breakdown">
          <EuiBasicTable
            tableCaption={this.props.type}
            items={this.props.breakdown}
            columns={columns}
            rowProps={getRowProps}
            noItemsMessage={this.props.noItemsMessage}
          />
        </div>
    );
  }
}