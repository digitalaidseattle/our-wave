

import {
    DashboardOutlined,
    FormOutlined
} from '@ant-design/icons';
import logo from "./assets/images/our-wave-logo.jpeg";

import { MenuItem } from "@digitalaidseattle/mui";

export const TemplateConfig = () => {
    const topLevel = {
        id: 'group-dashboard',
        title: 'Navigation',
        type: 'group',
        children: [
            {
                id: 'dashboard',
                title: 'Dashboard',
                type: 'item',
                url: '/',
                icon: <DashboardOutlined />
            },
            {
                id: 'GRNT-RECIPES',
                title: 'Grant Recipes',
                type: 'item',
                url: '/grant-recipes',
                icon: <FormOutlined />,
            } as MenuItem
           
        ],
    } as MenuItem;



    return ({
        appName: 'Our Wave',
        logoUrl: logo,
        drawerWidth: 240,
        menuItems: [topLevel],
        toolbarItems: [
        ],
        version: '0.0.1'
    });
}