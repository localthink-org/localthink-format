#!/usr/bin/env node
import { runCli } from "../src/cli.js";

process.exit(runCli(process.argv.slice(2)));
