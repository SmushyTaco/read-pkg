import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { parseJson } from '@smushytaco/parse-json';
import normalizePackageData from 'normalize-package-data';
import { toPath } from '@smushytaco/unicorn-magic';
import type { PackageJson as typeFestPackageJson } from 'type-fest';
import type { Package as normalizePackage } from 'normalize-package-data';

/**
 * Options for reading and parsing package.json files.
 */
export type Options = {
    /**
     * Current working directory.
     *
     * @default process.cwd()
     */
    readonly cwd?: URL | string;

    /**
     * Normalize the package data.
     *
     * @default true
     */
    readonly normalize?: boolean;
};

/**
 * Options for normalized package data.
 */
type _NormalizeOptions = {
    readonly normalize?: true;
};

/**
 * Options for parsing package.json files with normalization.
 */
export type NormalizeOptions = _NormalizeOptions & Options;

/**
 * Options for parsing a package.json string or object.
 */
export type ParseOptions = Omit<Options, 'cwd'>;
export type NormalizeParseOptions = _NormalizeOptions & ParseOptions;

/**
 * Type representing normalized package.json.
 */
export type NormalizedPackageJson = PackageJson & normalizePackage;

/**
 * Type representing a standard package.json.
 */
export type PackageJson = typeFestPackageJson;

const getPackagePath = (cwd?: URL | string): string =>
    path.resolve(toPath(cwd ?? process.cwd()), 'package.json');

const _readPackage = (
    file: string | object,
    normalize: boolean
): PackageJson | NormalizedPackageJson => {
    const json = typeof file === 'string' ? parseJson(file) : file;

    if (normalize && json !== null && typeof json === 'object') {
        normalizePackageData(json);
    }

    return json as PackageJson | NormalizedPackageJson;
};

// noinspection JSUnusedGlobalSymbols
/**
 * Reads and parses a package.json file asynchronously.
 *
 * @param options - Configuration options.
 * @returns The parsed package.json data.
 */
export async function readPackage<T extends Options | NormalizeOptions>(
    options?: T
): Promise<T extends NormalizeOptions ? NormalizedPackageJson : PackageJson> {
    const { cwd, normalize = true } = options ?? {};
    const packageFile = await fsPromises.readFile(getPackagePath(cwd), 'utf8');
    return _readPackage(packageFile, normalize) as T extends NormalizeOptions
        ? NormalizedPackageJson
        : PackageJson;
}

// noinspection JSUnusedGlobalSymbols
/**
 * Reads and parses a package.json file synchronously.
 *
 * @param options - Configuration options.
 * @returns The parsed package.json data.
 */
export function readPackageSync<T extends Options | NormalizeOptions>(
    options?: T
): T extends NormalizeOptions ? NormalizedPackageJson : PackageJson {
    const { cwd, normalize = true } = options ?? {};
    const packageFile = fs.readFileSync(getPackagePath(cwd), 'utf8');
    return _readPackage(packageFile, normalize) as T extends NormalizeOptions
        ? NormalizedPackageJson
        : PackageJson;
}

// noinspection JSUnusedGlobalSymbols
/**
 * Parses a package.json string or object.
 *
 * @param packageFile - The package.json data.
 * @param options - Configuration options.
 * @returns The parsed package.json data.
 */
export function parsePackage<T extends ParseOptions | NormalizeParseOptions>(
    packageFile: PackageJson | string,
    options?: T
): T extends NormalizeParseOptions ? NormalizedPackageJson : PackageJson {
    const { normalize = true } = options ?? {};
    const isObject =
        packageFile !== null &&
        typeof packageFile === 'object' &&
        !Array.isArray(packageFile);
    const isString = typeof packageFile === 'string';

    if (!isObject && !isString) {
        throw new TypeError(
            '`packageFile` should be either an `object` or a `string`.'
        );
    }

    const clonedPackageFile = isObject
        ? structuredClone(packageFile)
        : packageFile;

    return _readPackage(
        clonedPackageFile,
        normalize
    ) as T extends NormalizeParseOptions ? NormalizedPackageJson : PackageJson;
}
