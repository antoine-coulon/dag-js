/* eslint-disable no-inline-comments */
/* eslint-disable line-comment-position */
/* eslint-disable max-nested-callbacks */
import { expect } from "chai";

import { Dag } from "./dag.js";
import { VertexDefinition } from "./vertex.js";

type Vertex = VertexDefinition<any>;

describe("Directed Graph Implementation", () => {
  describe("When adding vertices to the graph", () => {
    it("should avoid duplicates by adding only vertices with unique ids", () => {
      const dag = new Dag();
      const vertexA: Vertex = {
        id: "a",
        adjacentTo: [],
        payload: {}
      };
      const vertexB: Vertex = {
        id: "b",
        adjacentTo: [],
        payload: {}
      };
      const vertexC: Vertex = {
        id: "c",
        adjacentTo: [],
        payload: {}
      };

      dag.addVertices(vertexA, vertexB, vertexC);
      expect(dag.asObject()).to.deep.equal({
        a: { id: "a", adjacentTo: [], payload: {} },
        b: { id: "b", adjacentTo: [], payload: {} },
        c: { id: "c", adjacentTo: [], payload: {} }
      });
      expect(Object.keys(dag.asObject()).length).to.equal(3);

      const duplicatedVertexB: Vertex = {
        id: "b",
        adjacentTo: [],
        payload: {}
      };
      dag.addVertices(duplicatedVertexB);
      expect(Object.keys(dag.asObject()).length).to.equal(3);
    });
  });

  describe("When adding edges to the graph", () => {
    it("should add edges between vertices", () => {
      const dag = new Dag();
      const vertexA: Vertex = { id: "a", adjacentTo: [], payload: {} };
      const vertexB: Vertex = { id: "b", adjacentTo: [], payload: {} };
      const vertexC: Vertex = { id: "c", adjacentTo: [], payload: {} };

      dag.addVertices(vertexA, vertexB, vertexC);
      dag.addEdge({ from: vertexB, to: vertexA });
      expect(vertexB.adjacentTo).deep.equal([vertexA.id]);

      dag.addEdge({ from: vertexB, to: vertexC });
      expect(vertexB.adjacentTo).deep.equal([vertexA.id, vertexC.id]);
    });

    it("should only add edges for vertices already added in the graph", () => {
      const dag = new Dag();
      const vertexA: Vertex = { id: "a", adjacentTo: [], payload: {} };
      const vertexB: Vertex = { id: "b", adjacentTo: [], payload: {} };

      dag.addVertices(vertexA);
      dag.addEdge({ from: vertexA, to: vertexB });
      expect(vertexA.adjacentTo).deep.equal([]);
    });

    it("should not add duplicate edges", () => {
      const dag = new Dag();
      const vertexA: Vertex = { id: "a", adjacentTo: [], payload: {} };
      const vertexB: Vertex = { id: "b", adjacentTo: [], payload: {} };

      dag.addVertices(vertexA, vertexB);
      dag.addEdge({ from: vertexB, to: vertexA });
      dag.addEdge({ from: vertexB, to: vertexA });

      expect(vertexB.adjacentTo).deep.equal([vertexA.id]);

      const vertexC: Vertex = { id: "c", adjacentTo: [], payload: {} };
      dag.addVertices(vertexC);
      dag.addEdge({ from: vertexB, to: vertexC });
      dag.addEdge({ from: vertexB, to: vertexC });
      expect(vertexB.adjacentTo).deep.equal([vertexA.id, vertexC.id]);
    });

    it("should not allow adding an edge from a vertex to the same vertex", () => {
      const dag = new Dag();
      const vertexA: Vertex = { id: "a", adjacentTo: [], payload: {} };

      dag.addVertices(vertexA);
      dag.addEdge({ from: vertexA, to: vertexA });

      expect(vertexA.adjacentTo).to.deep.equal([]);
    });
  });

  describe("When traversing the graph", () => {
    it("should find all adjacent vertices OF a given vertex", () => {
      const dag = new Dag();
      const vertexA: Vertex = { id: "a", adjacentTo: [], payload: {} };
      const vertexB: Vertex = { id: "b", adjacentTo: [], payload: {} };
      const vertexC: Vertex = { id: "c", adjacentTo: [], payload: {} };
      const vertexD: Vertex = { id: "d", adjacentTo: [], payload: {} };

      dag.addVertices(vertexA, vertexB, vertexC, vertexD);

      dag.addEdge({ from: vertexB, to: vertexA });
      expect(dag.getAdjacentVerticesTo(vertexB)).deep.equal([vertexA]);

      dag.addEdge({ from: vertexD, to: vertexA });
      dag.addEdge({ from: vertexD, to: vertexC });
      expect(dag.getAdjacentVerticesTo(vertexD)).deep.equal([vertexA, vertexC]);
    });

    it("should find all adjacent vertices FROM a given vertex", () => {
      const dag = new Dag();
      const vertexA: Vertex = { id: "a", adjacentTo: [], payload: {} };
      const vertexB: Vertex = { id: "b", adjacentTo: [], payload: {} };
      const vertexC: Vertex = { id: "c", adjacentTo: [], payload: {} };

      dag.addVertices(vertexA, vertexB, vertexC);

      dag.addEdge({ from: vertexA, to: vertexB });
      expect(dag.getAdjacentVerticesFrom(vertexB)).to.deep.equal([vertexA]);

      dag.addEdge({ from: vertexC, to: vertexB });
      expect(dag.getAdjacentVerticesFrom(vertexB)).to.deep.equal([
        vertexA,
        vertexC
      ]);
    });
  });

  describe("When detecting cycles between edges paths", () => {
    describe("When using infinite depth limit for detection", () => {
      it("should not detect a cycle between vertices with no edges pointing to each other", () => {
        const dag = new Dag();
        const vertexA: Vertex = { id: "a", adjacentTo: [], payload: {} };
        const vertexB: Vertex = { id: "b", adjacentTo: [], payload: {} };
        const vertexC: Vertex = { id: "b", adjacentTo: [], payload: {} };

        dag.addVertices(vertexA, vertexB, vertexC);

        dag.addEdge({ from: vertexA, to: vertexB });
        expect(dag.findCycles().hasCycles).to.equal(false);

        dag.addEdge({ from: vertexB, to: vertexC });
        expect(dag.findCycles().hasCycles).to.equal(false);
      });

      it("should detect a cycle of depth 1 between vertices with edges pointing to each other", () => {
        const dag = new Dag();
        const vertexA: Vertex = { id: "a", adjacentTo: [], payload: {} };
        const vertexB: Vertex = { id: "b", adjacentTo: [], payload: {} };

        dag.addVertices(vertexA, vertexB);

        dag.addEdge({ from: vertexA, to: vertexB });
        expect(dag.findCycles().hasCycles).to.equal(false);

        dag.addEdge({ from: vertexB, to: vertexA });
        expect(dag.findCycles().hasCycles).to.equal(true);
      });

      it("should detect a cycle of depth 2 between vertices with edges pointing to each other", () => {
        const dag = new Dag();
        const vertexA: Vertex = { id: "a", adjacentTo: [], payload: {} };
        const vertexB: Vertex = { id: "b", adjacentTo: [], payload: {} };
        const vertexC: Vertex = { id: "c", adjacentTo: [], payload: {} };
        const vertexD: Vertex = {
          id: "d",
          adjacentTo: [],
          payload: {}
        };

        dag.addVertices(vertexA, vertexB, vertexC, vertexD);
        dag.addEdge({ from: vertexA, to: vertexB });
        dag.addEdge({ from: vertexB, to: vertexC });
        dag.addEdge({ from: vertexC, to: vertexD });
        expect(dag.findCycles().hasCycles).to.equal(false);

        dag.addEdge({ from: vertexD, to: vertexA }); // D ----> A => cycle between A and D traversing B, C
        expect(dag.findCycles().hasCycles).to.equal(true);
      });

      it("should trace cycles paths of any given depth", () => {
        const dag = new Dag();
        const vertexA: Vertex = { id: "a", adjacentTo: [], payload: {} };
        const vertexB: Vertex = { id: "b", adjacentTo: [], payload: {} };
        const vertexC: Vertex = { id: "c", adjacentTo: [], payload: {} };
        const vertexD: Vertex = {
          id: "d",
          adjacentTo: [],
          payload: {}
        };

        dag.addVertices(vertexA, vertexB, vertexC, vertexD);
        dag.addEdge({ from: vertexC, to: vertexD });
        dag.addEdge({ from: vertexB, to: vertexC });
        dag.addEdge({ from: vertexA, to: vertexB });
        dag.addEdge({ from: vertexD, to: vertexA }); // D ----> A => cycle between A and D traversing B, C

        expect(dag.findCycles().cycles).to.deep.equal([["b", "c", "d", "a"]]);
      });

      it("should keep only one occurrence of a same cycle path", () => {
        const dag = new Dag();

        const fileA = {
          id: "A.js",
          adjacentTo: [],
          payload: { fileContent: "import FunctionB from 'B.js';" }
        };
        const fileB = {
          id: "B.js",
          adjacentTo: [],
          payload: { fileContent: "import FunctionC from 'C.js';" }
        };
        const fileC = {
          id: "C.js",
          adjacentTo: [],
          payload: { fileContent: "import FunctionA from 'A.js';" }
        };

        dag.addVertices(fileA, fileB, fileC);
        dag.addEdge({ from: fileA, to: fileB });
        dag.addEdge({ from: fileB, to: fileC });
        dag.addEdge({ from: fileC, to: fileA });

        expect(dag.findCycles().cycles.length).to.equal(1);
        expect(dag.findCycles().cycles).to.deep.equal([
          ["B.js", "C.js", "A.js"]
        ]);
      });
    });

    describe("When providing a max depth limit for detection", () => {
      it("should not detect any cycle as the specified depth is zero", () => {
        const dag = new Dag();
        const vertexA: Vertex = { id: "a", adjacentTo: [], payload: {} };
        const vertexB: Vertex = { id: "b", adjacentTo: [], payload: {} };

        dag.addVertices(vertexA, vertexB);
        dag.addEdge({ from: vertexA, to: vertexB });
        dag.addEdge({ from: vertexB, to: vertexA });
        expect(dag.findCycles({ maxDepth: 0 }).hasCycles).to.equal(false);
      });

      it("should detect the cycle only when the specified depth is greather than or equal to the depth of the cycle", () => {
        const dag = new Dag();
        const vertexA: Vertex = { id: "a", adjacentTo: [], payload: {} };
        const vertexB: Vertex = { id: "b", adjacentTo: [], payload: {} };
        const vertexC: Vertex = { id: "c", adjacentTo: [], payload: {} };
        const vertexD: Vertex = {
          id: "d",
          adjacentTo: [],
          payload: {}
        };

        dag.addVertices(vertexA, vertexB, vertexC, vertexD);
        dag.addEdge({ from: vertexA, to: vertexB });
        dag.addEdge({ from: vertexB, to: vertexC });
        dag.addEdge({ from: vertexC, to: vertexD });
        expect(dag.findCycles().hasCycles).to.equal(false);

        dag.addEdge({ from: vertexD, to: vertexA });
        expect(dag.findCycles({ maxDepth: 1 }).hasCycles).to.equal(false);
        expect(dag.findCycles({ maxDepth: 2 }).hasCycles).to.equal(false);
        expect(dag.findCycles({ maxDepth: 3 }).hasCycles).to.equal(false);
        expect(dag.findCycles({ maxDepth: 4 }).hasCycles).to.equal(true);
        expect(dag.findCycles({ maxDepth: 20 }).hasCycles).to.equal(true);
      });
    });
  });

  describe("When updating a vertex", () => {
    describe("With no adjacent vertices (no dependencies)", () => {
      it("should only update one vertex with no dependencies", () => {
        const dag = new Dag();
        const vertexA: Vertex = { id: "a", adjacentTo: [], payload: {} };
        const vertexE: Vertex = {
          id: "e",
          adjacentTo: [vertexA.id],
          payload: {}
        };
        const vertexB: Vertex = { id: "b", adjacentTo: [], payload: {} };

        dag.addVertices(vertexA, vertexB, vertexE);
        dag.addMutation(vertexB, { payload: [] });

        expect(vertexB.payload).to.deep.equal({ payload: [] });
        expect(vertexA.payload).to.deep.equal({});
        expect(vertexE.payload).to.deep.equal({});
      });
    });
  });
});
