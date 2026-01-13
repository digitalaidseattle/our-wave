/**
 *  TemplateConfig.tsx
 *
 *  @copyright 2025 Digital Aid Seattle
 *
 */
import { Box } from "@mui/material";
import {
    DashboardOutlined,
    FormOutlined
} from '@ant-design/icons';
import logo from "./assets/images/our-wave-logo.jpeg";
import { HelpButton, MenuItem } from "@digitalaidseattle/mui";

export const NAVIGATION_DRAWER_WIDTH = 240;
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
        drawerWidth: NAVIGATION_DRAWER_WIDTH,
        menuItems: [topLevel],
        toolbarItems: [
            <Box key={1}><HelpButton /></Box >
        ],
        version: '0.0.1'
    });
}