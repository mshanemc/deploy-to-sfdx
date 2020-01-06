import HomeMessage from '../../route/homeMessage/homeMessage';
import TopLevelError from '../../route/topLevelError/topLevelError';
import Deleted from '../../route/deleted/deleted';
import TestForm from '../../route/testForm/testForm';
import Byoo from '../../route/byoo/byoo';
import UserInfo from '../../route/userInfo/userInfo';
import DeployMessages from '../../route/deployMessages/deployMessages';
import TrialLoader from '../../route/trialLoader/trialLoader';

const routeTable = [
  {
    name: '',
    component: HomeMessage,
    tagName: 'route-home-message'
  },
  {
    name: '/testform',
    component: TestForm,
    tagName: 'route-test-form'
  },
  {
    name: '/error',
    component: TopLevelError,
    tagName: 'route-top-level-error',
    queryMap: [
      {
        query: 'msg',
        prop: 'errorMessage'
      }
    ]
  },
  {
    name: '/deploying/deployer/:deployId',
    component: DeployMessages,
    tagName: 'route-deploy-messages',
    paramMap: [
      {
        param: 'deployId',
        prop: 'deployId'
      }
    ]
  },
  {
    name: '/deploying/trial/:deployId',
    component: TrialLoader,
    tagName: 'route-trial-loader',
    paramMap: [
      {
        param: 'deployId',
        prop: 'deployId'
      }
    ]
  },
  {
    name: '/deleteConfirm',
    component: Deleted,
    tagName: 'route-deleted'
  },
  {
    name: 'deleteConfirm',
    component: Deleted,
    tagName: 'route-deleted'
  },
  {
    name: '/byoo',
    component: Byoo,
    tagName: 'route-byoo',
    queryMap: [
      {
        query: 'template',
        prop: 'template'
      }
    ]
  },
  {
    name: '/userinfo',
    component: UserInfo,
    tagName: 'route-user-info',
    queryMap: [
      {
        query: 'template',
        prop: 'template'
      }
    ]
  }
];

export { routeTable };
