# Author: RioRyuGen
# Date: 2026-05-22
# Revision: 1.0.0
import asyncio
from typing import AsyncGenerator, Callable, Iterator, TypeVar

T = TypeVar("T")


def iterator_to_async(
    func: Callable[..., Iterator[T]],
) -> Callable[..., AsyncGenerator[T, None]]:
    async def wrapper(*args, **kwargs) -> AsyncGenerator[T, None]:
        iterator = func(*args, **kwargs)
        for item in iterator:
            yield item
            await asyncio.sleep(0)

    return wrapper
