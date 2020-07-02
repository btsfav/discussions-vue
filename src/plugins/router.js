import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter);

import BlankPage from '@/pages/BlankPage';
import LogOutPage from "@/pages/LogOutPage";

//import MainLayoutPage from "@/pages/MainLayoutPage";

import SubmitPostPage from "@/pages/SubmitPostPage";
import UserProfilePage from "@/pages/UserProfilePage";
import CommunityPage from "@/pages/CommunityPage";
import BrowseSearchPage from "@/pages/BrowseSearchPage";
import BrowseFeedPage from "@/pages/BrowseFeedPage";
import BrowseThreadPage from "@/pages/BrowseThreadPage";
import BrowseTrendingPostsPage from "@/pages/BrowseTrendingPostsPage";
import BrowseTagPostsPage from "@/pages/BrowseTagPostsPage";
import BrowseNotifications from "@/pages/BrowseNotifications";

import SettingsPage from "@/pages/settings/SettingsPage";
import ContentSettingsPage from "@/pages/settings/ContentSettingsPage";
import BrowseWatchedThreadsPage from "@/pages/settings/BrowseWatchedThreadsPage";

import WalletPage from "@/pages/wallet/WalletPage";
import WalletAssetsPage from "@/pages/wallet/WalletAssetsPage";
import WalletWithdrawPage from "@/pages/wallet/WalletWithdrawPage";
import WalletDepositPage from "@/pages/wallet/WalletDepositPage";

import TestsPage from "@/pages/tests/TestsPage";
import TestEditorPage from '@/pages/tests/TestEditorPage';
import TestBrowsePostsPage from '@/pages/tests/posts/TestBrowsePostsPage';

const routes = [
    {
        path: '/',
        redirect: '/tag/all',
        component: BlankPage,
        children: [
            { path: 'submit', component: SubmitPostPage },
            { path: 'logout', component: LogOutPage },
            { path: 'feed', component: BrowseFeedPage },
            { path: 'search', component: BrowseSearchPage },
            { path: 'notifications', component: BrowseNotifications },
            { path: 'tag/all', component: BrowseTrendingPostsPage },
            { path: 'tag/:tags/submit', component: SubmitPostPage },
            { path: 'tag/:tags/:referenceId/:title?/:referenceId2?', component: BrowseThreadPage },
            { path: 'tag/:tags', component: BrowseTagPostsPage },
            { path: 'community', component: CommunityPage },
            { path: 'u/:who/:tab?', component: UserProfilePage },
            {
                path: 'wallet',
                component: WalletPage,
                redirect: `/wallet/assets`,
                children: [
                    //{ path: '', component: WalletAssetsPage },
                    { path: 'assets', component: WalletAssetsPage },
                    { path: 'withdraw', component: WalletWithdrawPage },
                    { path: 'deposit', component: WalletDepositPage }
                ]
            },
            {
                path: 'settings',
                redirect: `/settings/content`,
                component: SettingsPage,
                children: [
                    //{ path: '', component: ContentSettingsPage },
                    { path: 'content', component: ContentSettingsPage },
                    { path: 'watched', component: BrowseWatchedThreadsPage }
                ]
            }
        ]
    },
    {
        path: '/tests',
        component: BlankPage,
        children: [
            {
                path: '',
                component: TestsPage,
            },
            {
                path: 'editor',
                component: TestEditorPage
            },
            {
                path: 'posts',
                component: BlankPage,
                children: [
                    {
                        path: 'browse/:transactionIds',
                        component: TestBrowsePostsPage
                    }
                ]
            }
        ]
    }
]

const router = new VueRouter({
    mode: 'history',
    routes
})

router.beforeEach((to, from, next) => {
    console.proxyLog(`Route change from ${from.path} to ${to.path}`);
    next();
});

export default router;