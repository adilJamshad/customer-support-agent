import { END, START, StateGraph } from "@langchain/langgraph";
import { classifyNode } from "./nodes/classify.ts";
import { AgentStateSchema } from "./state.ts";

export const buildGraph = () =>
  new StateGraph(AgentStateSchema)
    .addNode("classify", classifyNode)
    .addEdge(START, "classify")
    .addEdge("classify", END)
    .compile();

export type SupportGraph = ReturnType<typeof buildGraph>;
