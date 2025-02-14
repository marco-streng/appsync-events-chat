#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AppSyncEventsChatStack } from "../lib/appsync-events-chat";

const app = new cdk.App();
new AppSyncEventsChatStack(app, "AppSyncEventsChatStack", {});
