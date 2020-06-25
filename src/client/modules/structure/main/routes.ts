import HomeMessage from '../../route/homeMessage/homeMessage';
import TopLevelError from '../../route/topLevelError/topLevelError';
import DeployMessages from '../../route/deployMessages/deployMessages';
import TrialLoader from '../../route/trialLoader/trialLoader';
import Deleted from '../../route/deleted/deleted';
import UserInfo from '../../route/userInfo/userInfo';
import Byoo from '../../route/byoo/byoo';
import TestForm from '../../route/testForm/testForm';

const routeTable = [
  {
    name: 'home',
    component: HomeMessage,
  },
  {
    name: 'error',
    component: TopLevelError,
    queryMap: [
      {
        query: 'msg',
        prop: 'rawError',
      },
    ],
  },
  {
    name: 'deploying/deployer/:deployId',
    tagName: 'route-deploy-messages',
    component: DeployMessages,
    paramMap: [
      {
        param: 'deployId',
        prop: 'deployId',
      },
    ],
  },
  {
    name: 'deploying/trial/:deployId',
    tagName: 'route-trial-messages',
    component: TrialLoader,
    paramMap: [
      {
        param: 'deployId',
        prop: 'deployId',
      },
    ],
  },
  {
    name: 'deleteConfirm',
    component: Deleted,
  },
  {
    name: 'userinfo',
    component: UserInfo,
    queryMap: [
      { query: 'template', prop: 'theTemplate' },
      { query: 'email', prop: 'email' },
    ],
  },
  {
    name: 'testform',
    component: TestForm,
  },
  {
    name: 'byoo',
    component: Byoo,
    queryMap: [{ query: 'template', prop: 'template' }],
  },
];

export { routeTable };
