import crypto from "node:crypto";

import { DiGraph } from "../../dist/index.js";

/**
 * Simulating a project with four distincts libraries.
 * lib1 depends on lib3 (via the use of lib3.MyLib3Component) while library 2 is
 * independant.
 */
const projectGraph = new DiGraph();

/**
 * Graph could be generated by statically analyzing imports in the projects
 * and recreating the project file structure
 */
const lib1Metadata = {
  id: "lib1",
  adjacentTo: [],
  payload: {
    component: `<lib3.MyLib3Component>hello lib1</lib3.MyLib3Component>`
  }
};
const lib2Metadata = {
  id: "lib2",
  adjacentTo: [],
  payload: { component: `<div>hello lib2</div>` }
};
const lib3Metadata = {
  id: "lib3",
  adjacentTo: [],
  payload: { component: `<MyLib3Component>hello lib3</MyLib3Component>` }
};

// Update the Graph with detected dependencies
projectGraph.addVertices(lib1Metadata, lib2Metadata, lib3Metadata);

// lib1 depends on lib3, we say that lib1 is adjacent to lib3
projectGraph.addEdge({ from: lib1Metadata, to: lib3Metadata });

// Simulating a simple cache, persisting an hashed value of the component
const cache = {
  lib1: {},
  lib2: {},
  lib3: {}
};

function hasLibraryChanged(library) {
  const libraryHashedContent = crypto
    .createHash("sha1")
    .update(library.payload.component)
    .digest("hex");

  return libraryHashedContent === cache[library.id].component;
}

function buildLibrary(library) {
  const libraryHashedContent = crypto
    .createHash("sha1")
    .update(library.payload.component)
    .digest("hex");

  console.log(`Building library: '${library.id}'`);
  // dependencyLib.buildFiles(); <= Webpack or any bundler
  cache[library.id].component = libraryHashedContent;
}

function buildAffected(library) {
  /**
   * If the component is still the same (i.e: hash data hasnt changed), we
   * don't want to rebuild it
   */
  if (hasLibraryChanged(library)) {
    // lib has not changed so does not require a new build
    console.log(`Using CACHED version of '${library.id}'`);

    return { hasLibraryBeenRebuilt: false };
  }

  // component's hash changed, meaning we must build the library
  buildLibrary(library);

  return { hasLibraryBeenRebuilt: true };
}

function* buildAllLibraryDependencies(rootLibrary) {
  for (const rootLibraryDependency of projectGraph.getAdjacentVerticesTo(
    rootLibrary
  )) {
    /**
     * Recursively build affected libraries starting from the deepest dependencies
     * of the root library.
     * N.B: DiGraph could also be used in order to orchestrate parallelization. For
     * example, two dependencies which don't share any dependencies in common
     * could be built in parallel.
     */
    yield* buildAllLibraryDependencies(rootLibraryDependency);
  }

  // End up by building the root library once all dependencies are up-to-date
  const { hasLibraryBeenRebuilt } = buildAffected(rootLibrary);

  yield hasLibraryBeenRebuilt;
}

/**
 * Build a library using affected mode (i.e: using DiGraph and cache to skip
 * unecessary re-build if possible)
 */
function buildLibraryUsingAffectedDetection(rootLibrary) {
  const rootLibraryDependencies =
    projectGraph.getAdjacentVerticesTo(rootLibrary);
  const allRebuiltLibraries = [];

  for (const dependencyLibrary of rootLibraryDependencies) {
    allRebuiltLibraries.push([
      ...buildAllLibraryDependencies(dependencyLibrary)
    ]);
  }

  // Here would happen the process of bundling files with a tool such as Webpack

  /**
   * All root library's dependencies were re-built if necessary (i.e: affected).
   * However, we now need to determine if the root library has to also be
   * rebuilt. There are 2 conditions requiring the root library to be rebuilt:
   * - The root library itself changed
   * - Atleast one of the dependencies of the library changed
   */
  const HAS_LIBRARY_BEEN_REBUILT = true;
  const atleastOneLibraryChanged = allRebuiltLibraries
    .flat()
    .includes(HAS_LIBRARY_BEEN_REBUILT);

  if (atleastOneLibraryChanged) {
    buildLibrary(rootLibrary);
  } else {
    // Library itself changed
    buildAffected(rootLibrary);
  }
}

function buildProjectUsingAffectedStrategy() {
  console.log("\n----STEP 1-----");
  buildLibraryUsingAffectedDetection(lib1Metadata); // building for the first time
  /**
   * building for the second time but no dependencies of lib1 changed (neither
   * lib3 or lib4) so it remains UNAFFECTED (i.e: using cache)
   */
  console.log("\n----STEP 2-----");
  buildLibraryUsingAffectedDetection(lib1Metadata);

  /**
   * Let's now change the content of lib3's component.
   * Remember, lib1 depends on lib3 via the use of lib3.MyLib3Component.
   */
  console.log("\n----STEP 3-----");
  console.log("Changing lib3's content...");
  projectGraph.addMutation(lib3Metadata, {
    // new lib3 component
    component: `<MyLib3Component>hello affected lib3!</MyLib3Component>`
  });

  /**
   * Now that lib3 (dependency of lib1) changed BOTH lib3 and lib1 are considered
   * affected.
   * It means that we must rebuild both, starting with lib3 (lib1 must build
   * with the latest version of lib3).
   */
  console.log("\n----STEP 4-----");
  buildLibraryUsingAffectedDetection(lib1Metadata);
}

buildProjectUsingAffectedStrategy();