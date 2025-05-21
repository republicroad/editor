from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/api/simulate")
async def simulate():
    """
        这是此接口前端的入参, 
        {
            "context": null,
            "content": {
                "nodes": [
                    {
                        "type": "inputNode",
                        "content": {
                            "schema": ""
                        },
                        "id": "5a5a1b59-51d0-4f5a-a0bf-666851a48707",
                        "name": "request",
                        "position": {
                            "x": 185,
                            "y": 300
                        }
                    }
                ],
                "edges": []
            }
        }
    """
    # zen engine
    # 在这里引入我们的 zen-engine manager 模块.
    # 用来探索自定义节点等.
    # rust 程序等后期再去实现.
    return {"message": "Hello World"}
