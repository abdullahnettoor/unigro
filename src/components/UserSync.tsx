import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";

export function UserSync() {
    const storeUser = useMutation(api.users.store);
    const [synced, setSynced] = useState(false);

    useEffect(() => {
        if (!synced) {
            storeUser()
                .then((id) => {
                    console.log("User synced:", id);
                    setSynced(true);
                })
                .catch((error) => {
                    console.error("Failed to sync user:", error);
                });
        }
    }, [storeUser, synced]);

    return null;
}
